<?php

namespace App\Services;

use App\Models\Intelligence\PartnerHealthScore;
use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PartnerHealthService
{
    public static function calculate(Partner $partner, ?User $actor = null): PartnerHealthScore
    {
        $partner->load([
            'revenues',
            'costs',
            'payments',
            'bandwidthAllocations',
            'customerMetrics',
            'commissions',
            'supportCenters',
            'documents',
        ]);

        $period = Carbon::now()->format('Y-m');
        $data   = [];

        $financialScore = self::financialHealthScore($partner, $data);
        $revenueScore = self::revenueGrowthScore($partner, $data);

        $profitScore = self::profitabilityScore($partner, $data);

        $paymentScore = self::paymentBehaviorScore($partner, $data);

        $bandwidthScore = self::bandwidthGrowthScore($partner, $data);

        $customerScore = self::customerGrowthScore($partner, $data);

        $operationalScore = self::operationalScore($partner, $data);

        $total = round(
            ($financialScore  * 0.25) +
            ($revenueScore    * 0.20) +
            ($profitScore     * 0.20) +
            ($paymentScore    * 0.10) +
            ($bandwidthScore  * 0.10) +
            ($customerScore   * 0.10) +
            ($operationalScore * 0.05),
            2
        );

        $status = PartnerHealthScore::statusFor($total);

        $record = PartnerHealthScore::create([
            'partner_id'              => $partner->id,
            'total_score'             => $total,
            'status'                  => $status,
            'financial_health_score'  => $financialScore,
            'revenue_growth_score'    => $revenueScore,
            'profitability_score'     => $profitScore,
            'payment_behavior_score'  => $paymentScore,
            'bandwidth_growth_score'  => $bandwidthScore,
            'customer_growth_score'   => $customerScore,
            'operational_score'       => $operationalScore,
            'calculation_data'        => $data,
            'period'                  => $period,
            'calculated_by'           => $actor?->id ?? auth()->id(),
            'calculated_at'           => now(),
        ]);

        $partner->update([
            'health_score'  => $total,
            'health_status' => $status,
        ]);

        TimelineService::record(
            $partner,
            'Health Score Calculated',
            'Business',
            "Health Score: {$total} ({$status})",
            null,
            [
                'severity'    => $status === 'Critical' ? 'Danger'
                    : ($status === 'Risk' ? 'Warning'
                    : ($status === 'Excellent' ? 'Success' : 'Info')),
                'performed_by' => $actor,
            ]
        );

        return $record;
    }

    public static function latest(Partner $partner): ?PartnerHealthScore
    {
        return PartnerHealthScore::where('partner_id', $partner->id)
            ->latest('calculated_at')
            ->first();
    }

    public static function history(Partner $partner, int $limit = 12): \Illuminate\Support\Collection
    {
        return PartnerHealthScore::where('partner_id', $partner->id)
            ->orderByDesc('calculated_at')
            ->limit($limit)
            ->get();
    }

    private static function financialHealthScore(Partner $partner, array &$data): float
    {
        $creditLimit  = (float) ($partner->credit_limit ?? 0);
        $outstanding  = self::outstandingAmount($partner);

        if ($creditLimit <= 0) {
            $data['financial_health'] = ['note' => 'No credit limit configured', 'score' => 70];
            return 70.0;
        }

        $utilizationPct = ($outstanding / $creditLimit) * 100;

        $score = max(0, min(100, 100 - $utilizationPct));

        $data['financial_health'] = [
            'credit_limit'     => $creditLimit,
            'outstanding'      => $outstanding,
            'utilization_pct'  => round($utilizationPct, 2),
            'score'            => round($score, 2),
        ];

        return round($score, 2);
    }

    private static function revenueGrowthScore(Partner $partner, array &$data): float
    {
        $now  = Carbon::now();
        $prev = $now->copy()->subMonth();

        $currentRevenue  = self::revenueForMonth($partner, $now);
        $previousRevenue = self::revenueForMonth($partner, $prev);

        if ($previousRevenue <= 0) {
            $data['revenue_growth'] = ['note' => 'No previous revenue', 'score' => 60];
            return 60.0;
        }

        $growthPct = (($currentRevenue - $previousRevenue) / $previousRevenue) * 100;

        $score = max(0, min(100, 60 + ($growthPct * 2)));

        $data['revenue_growth'] = [
            'current_revenue'  => $currentRevenue,
            'previous_revenue' => $previousRevenue,
            'growth_pct'       => round($growthPct, 2),
            'score'            => round($score, 2),
        ];

        return round($score, 2);
    }

    private static function profitabilityScore(Partner $partner, array &$data): float
    {
        $now = Carbon::now();

        $revenue = self::revenueForMonth($partner, $now);
        $cost    = self::costForMonth($partner, $now);

        if ($revenue <= 0) {
            $data['profitability'] = ['note' => 'No revenue this month', 'score' => 0];
            return 0.0;
        }

        $profitMarginPct = (($revenue - $cost) / $revenue) * 100;

        $score = max(0, min(100, 50 + ($profitMarginPct * 1.25)));

        $data['profitability'] = [
            'revenue'           => $revenue,
            'cost'              => $cost,
            'profit_margin_pct' => round($profitMarginPct, 2),
            'score'             => round($score, 2),
        ];

        return round($score, 2);
    }

    private static function paymentBehaviorScore(Partner $partner, array &$data): float
    {
        $totalInvoiced = $partner->revenues()->sum('amount') ?: 0;
        $totalPaid     = $partner->payments()->sum('amount') ?: 0;
        $outstanding   = max(0, $totalInvoiced - $totalPaid);

        $overdueRevenues = $partner->revenues()
            ->where('revenue_date', '<=', Carbon::now()->subDays(30))
            ->whereNull('deleted_at')
            ->sum('amount') ?: 0;

        $overdueRatio = $totalInvoiced > 0 ? ($overdueRevenues / $totalInvoiced) : 0;

        $score = max(0, 100 - ($overdueRatio * 100));

        $data['payment_behavior'] = [
            'total_invoiced'  => $totalInvoiced,
            'total_paid'      => $totalPaid,
            'outstanding'     => $outstanding,
            'overdue_ratio'   => round($overdueRatio * 100, 2),
            'score'           => round($score, 2),
        ];

        return round($score, 2);
    }

    private static function bandwidthGrowthScore(Partner $partner, array &$data): float
    {
        $allocations = $partner->bandwidthAllocations()
            ->orderBy('effective_date')
            ->get(['allocated_mbps', 'effective_date']);

        if ($allocations->count() < 2) {
            $data['bandwidth_growth'] = ['note' => 'Insufficient allocation history', 'score' => 60];
            return 60.0;
        }

        $first   = (float) $allocations->first()->allocated_mbps;
        $current = (float) $allocations->last()->allocated_mbps;

        if ($first <= 0) {
            $data['bandwidth_growth'] = ['note' => 'Invalid first allocation', 'score' => 60];
            return 60.0;
        }

        $growthPct = (($current - $first) / $first) * 100;

        $score = max(0, min(100, 60 + ($growthPct * 0.8)));

        $data['bandwidth_growth'] = [
            'first_mbps'   => $first,
            'current_mbps' => $current,
            'growth_pct'   => round($growthPct, 2),
            'score'        => round($score, 2),
        ];

        return round($score, 2);
    }

    private static function customerGrowthScore(Partner $partner, array &$data): float
    {
        $latest = $partner->customerMetrics()
            ->orderByDesc('metric_date')
            ->first();

        if (! $latest) {
            $data['customer_growth'] = ['note' => 'No customer metrics', 'score' => 50];
            return 50.0;
        }

        $opening = (float) $latest->opening_customers;
        $closing = (float) $latest->closing_customers;

        if ($opening <= 0) {
            $data['customer_growth'] = ['note' => 'No opening customers', 'score' => 60];
            return 60.0;
        }

        $growthPct = (($closing - $opening) / $opening) * 100;

        $score = max(0, min(100, 60 + ($growthPct * 4)));

        $data['customer_growth'] = [
            'opening_customers' => $opening,
            'closing_customers' => $closing,
            'growth_pct'        => round($growthPct, 2),
            'score'             => round($score, 2),
        ];

        return round($score, 2);
    }

    private static function operationalScore(Partner $partner, array &$data): float
    {
        $activeSCs = $partner->supportCenters()->where('status', 'Active')->count();
        $totalSCs  = $partner->supportCenters()->count();

        $totalEquipment   = $partner->equipment()->count();
        $faultyEquipment  = $partner->equipment()->where('status', 'Faulty')->count();

        $faultRate = $totalEquipment > 0 ? ($faultyEquipment / $totalEquipment) * 100 : 0;

        $scScore = $totalSCs > 0 ? ($activeSCs / $totalSCs) * 100 : 70;

        $equipScore = max(0, 100 - ($faultRate * 2));

        $score = round(($scScore * 0.5) + ($equipScore * 0.5), 2);

        $data['operational'] = [
            'active_scs'       => $activeSCs,
            'total_scs'        => $totalSCs,
            'total_equipment'  => $totalEquipment,
            'faulty_equipment' => $faultyEquipment,
            'fault_rate_pct'   => round($faultRate, 2),
            'score'            => $score,
        ];

        return $score;
    }


    private static function outstandingAmount(Partner $partner): float
    {
        $totalRevenue = $partner->revenues()->sum('amount') ?: 0;
        $totalPaid    = $partner->payments()->sum('amount') ?: 0;

        return max(0, $totalRevenue - $totalPaid);
    }

    private static function revenueForMonth(Partner $partner, Carbon $month): float
    {
        return (float) $partner->revenues()
            ->whereYear('revenue_date', $month->year)
            ->whereMonth('revenue_date', $month->month)
            ->sum('amount');
    }

    private static function costForMonth(Partner $partner, Carbon $month): float
    {
        return (float) $partner->costs()
            ->whereYear('cost_date', $month->year)
            ->whereMonth('cost_date', $month->month)
            ->sum('amount');
    }
}
