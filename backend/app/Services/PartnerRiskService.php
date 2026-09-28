<?php

namespace App\Services;

use App\Models\Intelligence\PartnerRiskIndicator;
use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class PartnerRiskService
{
    public static function detect(Partner $partner, ?User $actor = null): array
    {
        $partner->load([
            'revenues',
            'costs',
            'payments',
            'bandwidthAllocations',
            'equipment',
            'customerMetrics',
            'supportCenters.costs',
            'documents',
        ]);

        PartnerRiskIndicator::where('partner_id', $partner->id)
            ->where('is_active', true)
            ->update(['is_active' => false, 'resolved_at' => now()]);

        $detected = [];

        $detected = array_merge($detected, self::financialRisks($partner));

        $detected = array_merge($detected, self::marketingRisks($partner));

        $detected = array_merge($detected, self::networkRisks($partner));

        $detected = array_merge($detected, self::equipmentRisks($partner));

        $detected = array_merge($detected, self::supportCenterRisks($partner));

        $detected = array_merge($detected, self::contractRisks($partner));

        $saved = [];
        foreach ($detected as $risk) {
            $saved[] = PartnerRiskIndicator::create(array_merge($risk, [
                'partner_id'  => $partner->id,
                'is_active'   => true,
                'detected_at' => now(),
                'detected_by' => $actor?->id ?? auth()->id(),
            ]));
        }

        return $saved;
    }

    public static function active(Partner $partner): Collection
    {
        return PartnerRiskIndicator::where('partner_id', $partner->id)
            ->where('is_active', true)
            ->orderByRaw("FIELD(severity, 'Critical','High','Medium','Low')")
            ->get();
    }

    public static function summary(Partner $partner): array
    {
        $active = self::active($partner);

        return [
            'total'    => $active->count(),
            'critical' => $active->where('severity', 'Critical')->count(),
            'high'     => $active->where('severity', 'High')->count(),
            'medium'   => $active->where('severity', 'Medium')->count(),
            'low'      => $active->where('severity', 'Low')->count(),
            'by_category' => $active->groupBy('risk_category')
                ->map(fn($g) => $g->count()),
        ];
    }


    private static function financialRisks(Partner $partner): array
    {
        $risks = [];

        $creditLimit   = (float) ($partner->credit_limit ?? 0);
        $totalRevenue  = (float) $partner->revenues()->sum('amount');
        $totalPaid     = (float) $partner->payments()->sum('amount');
        $outstanding   = max(0, $totalRevenue - $totalPaid);

        if ($creditLimit > 0 && $outstanding >= $creditLimit * 0.8) {
            $severity = $outstanding >= $creditLimit ? 'Critical' : 'High';
            $risks[]  = [
                'risk_category' => 'Financial',
                'risk_type'     => 'outstanding_high',
                'severity'      => $severity,
                'title'         => 'Outstanding balance near/over credit limit',
                'description'   => "Outstanding ৳" . number_format($outstanding, 0)
                    . " is " . round(($outstanding / $creditLimit) * 100, 1)
                    . "% of the ৳" . number_format($creditLimit, 0) . " credit limit.",
                'trigger_data'  => [
                    'outstanding'      => $outstanding,
                    'credit_limit'     => $creditLimit,
                    'utilization_pct'  => round(($outstanding / $creditLimit) * 100, 2),
                ],
            ];
        }

        $now  = Carbon::now();
        $prev = $now->copy()->subMonth();

        $currentRev  = self::revenueForMonth($partner, $now);
        $previousRev = self::revenueForMonth($partner, $prev);

        if ($previousRev > 0 && $currentRev < $previousRev * 0.9) {
            $declinePct = round((($previousRev - $currentRev) / $previousRev) * 100, 1);
            $risks[]    = [
                'risk_category' => 'Financial',
                'risk_type'     => 'revenue_declining',
                'severity'      => $declinePct >= 20 ? 'High' : 'Medium',
                'title'         => "Revenue declined {$declinePct}% vs last month",
                'description'   => "Current month revenue ৳" . number_format($currentRev, 0)
                    . " vs ৳" . number_format($previousRev, 0) . " last month.",
                'trigger_data'  => [
                    'current_revenue'  => $currentRev,
                    'previous_revenue' => $previousRev,
                    'decline_pct'      => $declinePct,
                ],
            ];
        }

        $currentCost  = self::costForMonth($partner, $now);
        $previousCost = self::costForMonth($partner, $prev);
        $currentProfit  = $currentRev - $currentCost;
        $previousProfit = $previousRev - $previousCost;

        if ($previousProfit > 0 && $currentProfit < $previousProfit * 0.85) {
            $risks[] = [
                'risk_category' => 'Financial',
                'risk_type'     => 'profit_declining',
                'severity'      => 'Medium',
                'title'         => 'Profitability declining',
                'description'   => "Current profit ৳" . number_format($currentProfit, 0)
                    . " vs ৳" . number_format($previousProfit, 0) . " last month.",
                'trigger_data'  => [
                    'current_profit'  => $currentProfit,
                    'previous_profit' => $previousProfit,
                ],
            ];
        }

        return $risks;
    }

    private static function marketingRisks(Partner $partner): array
    {
        $risks   = [];
        $metrics = $partner->customerMetrics()->orderByDesc('metric_date')->first();

        if (! $metrics) return $risks;

        $opening = (float) $metrics->opening_customers;
        $closing = (float) $metrics->closing_customers;
        $churn   = (float) ($metrics->churned_customers ?? 0);

        if ($opening > 0) {
            $churnRate = ($churn / $opening) * 100;
            if ($churnRate >= 10) {
                $risks[] = [
                    'risk_category' => 'Marketing',
                    'risk_type'     => 'churn_high',
                    'severity'      => $churnRate >= 20 ? 'Critical' : 'High',
                    'title'         => "High churn rate: {$churnRate}%",
                    'description'   => "{$churn} customers churned out of {$opening} (churn rate: {$churnRate}%).",
                    'trigger_data'  => [
                        'churn_count' => $churn,
                        'opening'     => $opening,
                        'churn_rate'  => round($churnRate, 2),
                    ],
                ];
            }

            if ($closing < $opening) {
                $declinePct = round((($opening - $closing) / $opening) * 100, 1);
                $risks[]    = [
                    'risk_category' => 'Marketing',
                    'risk_type'     => 'customer_decline',
                    'severity'      => 'Medium',
                    'title'         => "Customer base declined by {$declinePct}%",
                    'description'   => "Active customers dropped from {$opening} to {$closing}.",
                    'trigger_data'  => [
                        'opening_customers' => $opening,
                        'closing_customers' => $closing,
                        'decline_pct'       => $declinePct,
                    ],
                ];
            }
        }

        return $risks;
    }

    private static function networkRisks(Partner $partner): array
    {
        $risks = [];

        $latestAlloc = $partner->bandwidthAllocations()
            ->where('status', 'Active')
            ->orderByDesc('effective_date')
            ->first();

        if (! $latestAlloc) return $risks;

        $totalMbps = (float) ($latestAlloc->allocated_mbps ?? 0);
        $usedMbps  = (float) ($latestAlloc->used_mbps ?? 0);

        if ($totalMbps > 0) {
            $utilPct = ($usedMbps / $totalMbps) * 100;

            if ($utilPct >= 90) {
                $risks[] = [
                    'risk_category' => 'Network',
                    'risk_type'     => 'utilization_high',
                    'severity'      => $utilPct >= 95 ? 'Critical' : 'High',
                    'title'         => "Bandwidth utilization at " . round($utilPct, 1) . "%",
                    'description'   => "Using {$usedMbps} Mbps of {$totalMbps} Mbps allocated. Capacity upgrade should be considered.",
                    'trigger_data'  => [
                        'total_mbps'    => $totalMbps,
                        'used_mbps'     => $usedMbps,
                        'utilization'   => round($utilPct, 2),
                        'threshold'     => 90,
                    ],
                ];
            }

            if ($utilPct < 20 && $totalMbps > 0) {
                $risks[] = [
                    'risk_category' => 'Network',
                    'risk_type'     => 'utilization_low',
                    'severity'      => 'Low',
                    'title'         => "Low bandwidth utilization: " . round($utilPct, 1) . "%",
                    'description'   => "Only using {$usedMbps} Mbps of {$totalMbps} Mbps. Downgrade may reduce cost.",
                    'trigger_data'  => [
                        'total_mbps'  => $totalMbps,
                        'used_mbps'   => $usedMbps,
                        'utilization' => round($utilPct, 2),
                    ],
                ];
            }
        }

        return $risks;
    }

    private static function equipmentRisks(Partner $partner): array
    {
        $risks = [];

        $totalEquipment  = $partner->equipment()->count();
        $faultyEquipment = $partner->equipment()->where('status', 'Faulty')->count();

        if ($totalEquipment > 0) {
            $faultRate = ($faultyEquipment / $totalEquipment) * 100;
            if ($faultRate >= 20) {
                $risks[] = [
                    'risk_category' => 'Equipment',
                    'risk_type'     => 'high_failure_rate',
                    'severity'      => $faultRate >= 40 ? 'High' : 'Medium',
                    'title'         => "Equipment failure rate: " . round($faultRate, 1) . "%",
                    'description'   => "{$faultyEquipment} of {$totalEquipment} equipment units are faulty.",
                    'trigger_data'  => [
                        'total_equipment'  => $totalEquipment,
                        'faulty_equipment' => $faultyEquipment,
                        'fault_rate'       => round($faultRate, 2),
                    ],
                ];
            }
        }

        $warrantyAlertDays = (int) \App\Models\Setting::get('equipment_warranty_alert_days', 30);

        $expiringWarranty = $partner->equipment()
            ->whereNotNull('warranty_end')
            ->where('warranty_end', '>=', Carbon::now())
            ->where('warranty_end', '<=', Carbon::now()->addDays($warrantyAlertDays))
            ->count();

        if ($expiringWarranty > 0) {
            $risks[] = [
                'risk_category' => 'Equipment',
                'risk_type'     => 'warranty_expiry',
                'severity'      => 'Medium',
                'title'         => "{$expiringWarranty} equipment warranty expiring within {$warrantyAlertDays} days",
                'description'   => "Equipment warranty nearing expiry. Renewal or replacement planning required.",
                'trigger_data'  => ['count' => $expiringWarranty, 'alert_days' => $warrantyAlertDays],
            ];
        }

        return $risks;
    }

    private static function supportCenterRisks(Partner $partner): array
    {
        $risks = [];

        $inactiveScs = $partner->supportCenters()
            ->whereIn('status', ['Suspended', 'Temporarily Closed'])
            ->count();

        if ($inactiveScs > 0) {
            $risks[] = [
                'risk_category' => 'Support Center',
                'risk_type'     => 'branch_inactive',
                'severity'      => 'Medium',
                'title'         => "{$inactiveScs} Support Center(s) inactive/suspended",
                'description'   => "Inactive branches may impact customer service and revenue contribution.",
                'trigger_data'  => ['inactive_count' => $inactiveScs],
            ];
        }

        $activeScs = $partner->supportCenters()->where('status', 'Active')->with('costs')->get();
        foreach ($activeScs as $sc) {
            $monthCost = $sc->costs()
                ->whereMonth('cost_date', Carbon::now()->month)
                ->whereYear('cost_date', Carbon::now()->year)
                ->sum('amount');

            $revenueContrib = (float) ($sc->revenue_contribution ?? 0);

            if ($monthCost > 0 && $revenueContrib > 0 && $monthCost > $revenueContrib * 1.5) {
                $risks[] = [
                    'risk_category' => 'Support Center',
                    'risk_type'     => 'high_operating_cost',
                    'severity'      => 'High',
                    'title'         => "SC '{$sc->center_name}': operating cost exceeds revenue",
                    'description'   => "Monthly cost ৳" . number_format($monthCost, 0)
                        . " vs ৳" . number_format($revenueContrib, 0) . " revenue contribution.",
                    'trigger_data'  => [
                        'center_id'          => $sc->id,
                        'center_name'        => $sc->center_name,
                        'monthly_cost'       => $monthCost,
                        'revenue_contrib'    => $revenueContrib,
                    ],
                ];
            }
        }

        return $risks;
    }

    private static function contractRisks(Partner $partner): array
    {
        $risks = [];

        $configuredAlertDays = \App\Models\Setting::get('document_expiry_alert_days', [90, 60, 30, 15, 7, 0]);
        if (! is_array($configuredAlertDays)) {
            $configuredAlertDays = json_decode($configuredAlertDays, true) ?? [90, 60, 30, 15, 7, 0];
        }
        $maxAlertWindow = max(array_filter(array_map('intval', $configuredAlertDays), fn($d) => $d > 0));
        $criticalThreshold = (int) \App\Models\Setting::get('health_threshold_critical', 30);

        $expiringDocs = $partner->documents()
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '>=', Carbon::now())
            ->where('expiry_date', '<=', Carbon::now()->addDays($maxAlertWindow))
            ->where('status', 'Active')
            ->get(['id', 'document_name', 'expiry_date', 'document_type']);

        foreach ($expiringDocs as $doc) {
            $daysLeft = Carbon::now()->diffInDays($doc->expiry_date, false);
            $risks[]  = [
                'risk_category' => 'Contract',
                'risk_type'     => 'document_expiry',
                'severity'      => $daysLeft <= $criticalThreshold ? 'High' : 'Medium',
                'title'         => "Document expiring in {$daysLeft} days: {$doc->document_name}",
                'description'   => "{$doc->document_type} '{$doc->document_name}' expires on "
                    . Carbon::parse($doc->expiry_date)->format('d M Y') . ".",
                'trigger_data'  => [
                    'document_id'   => $doc->id,
                    'document_name' => $doc->document_name,
                    'expiry_date'   => $doc->expiry_date,
                    'days_left'     => $daysLeft,
                ],
            ];
        }

        $expiredDocs = $partner->documents()
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<', Carbon::now())
            ->where('status', 'Active')
            ->count();

        if ($expiredDocs > 0) {
            $risks[] = [
                'risk_category' => 'Contract',
                'risk_type'     => 'expired_documents',
                'severity'      => 'High',
                'title'         => "{$expiredDocs} document(s) expired but still active",
                'description'   => "Documents past their expiry date should be renewed or archived.",
                'trigger_data'  => ['count' => $expiredDocs],
            ];
        }

        return $risks;
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
