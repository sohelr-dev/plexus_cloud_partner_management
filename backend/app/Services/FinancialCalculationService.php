<?php

namespace App\Services;

use App\Models\Financial\PartnerCost;
use App\Models\Financial\PartnerPayment;
use App\Models\Financial\PartnerProfitLoss;
use App\Models\Financial\PartnerRevenue;
use App\Models\Financial\PartnerRoi;
use App\Models\Partner\Partner;
use App\Models\SupportCenter\PartnerSupportCenter;
use App\Models\SupportCenter\PartnerSupportCenterStaff;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * FinancialCalculationService
 * Formulas:
 *   Gross Profit       = Revenue - Direct Cost
 *   Net Profit         = Revenue - Total Costs
 *   Profit Margin %    = (Net Profit / Revenue) * 100
 *   ROI %              = (Net Return / Investment) * 100
 *   Outstanding        = Total Invoiced - Total Paid
 *   Credit Utilization = (Outstanding / Credit Limit) * 100
 */
class FinancialCalculationService
{
    /**
     * Compute and snapshot P&L for a specific partner and period (YYYY-MM).
     */
    public static function calculatePnL(Partner $partner, ?string $periodKey = null): PartnerProfitLoss
    {
        $periodKey = $periodKey ?? Carbon::now()->format('Y-m');

        // Parse month range
        $startDate = Carbon::createFromFormat('Y-m', $periodKey)->startOfMonth();
        $endDate   = Carbon::createFromFormat('Y-m', $periodKey)->endOfMonth();

        // 1. Sum Revenues
        $totalRevenue = PartnerRevenue::where('partner_id', $partner->id)
            ->whereBetween('revenue_date', [$startDate, $endDate])
            ->sum('amount');

        // 2. Sum Direct Cost vs Operating Cost vs Commission vs Support Center Cost
        $directCost = PartnerCost::where('partner_id', $partner->id)
            ->whereBetween('cost_date', [$startDate, $endDate])
            ->whereIn('cost_type', ['Bandwidth Cost', 'Upstream Cost', 'Direct Cost'])
            ->sum('amount');

        $commissionCost = PartnerCost::where('partner_id', $partner->id)
            ->whereBetween('cost_date', [$startDate, $endDate])
            ->where('cost_type', 'Commission')
            ->sum('amount');

        // SC Operating Costs (mirrored from SC Cost module via PartnerCost)
        $supportCenterCost = PartnerCost::where('partner_id', $partner->id)
            ->whereBetween('cost_date', [$startDate, $endDate])
            ->where('cost_type', 'Support Center Cost')
            ->sum('amount');
        // This is NOT mirrored to PartnerCost, so we aggregate it separately here.
        $scStaffCost = PartnerSupportCenter::where('partner_id', $partner->id)
            ->get()
            ->sum(function ($center) {
                return PartnerSupportCenterStaff::where('support_center_id', $center->id)
                    ->where('status', 'Active')
                    ->sum('monthly_cost');
            });

        $operatingCost = PartnerCost::where('partner_id', $partner->id)
            ->whereBetween('cost_date', [$startDate, $endDate])
            ->whereNotIn('cost_type', ['Bandwidth Cost', 'Upstream Cost', 'Direct Cost', 'Commission', 'Support Center Cost'])
            ->sum('amount');

        $totalCost = $directCost + $commissionCost + $supportCenterCost + $scStaffCost + $operatingCost;

        // 3. Formulas
        $grossProfit = $totalRevenue - $directCost;
        $netProfit   = $totalRevenue - $totalCost;
        $marginPct   = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0;

        // 4. Payments & Outstanding
        $totalPaid = PartnerPayment::where('partner_id', $partner->id)
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->where('status', 'Completed')
            ->sum('amount');

        $totalInvoiced = $totalRevenue; // default invoiced = revenue
        $outstanding   = max(0, $totalInvoiced - $totalPaid);

        return PartnerProfitLoss::updateOrCreate(
            [
                'partner_id'  => $partner->id,
                'period_type' => 'Monthly',
                'period_key'  => $periodKey,
            ],
            [
                'total_revenue'         => $totalRevenue,
                'direct_cost'           => $directCost,
                'gross_profit'          => $grossProfit,
                'operating_cost'        => $operatingCost,
                'commission_cost'       => $commissionCost,
                'support_center_cost'   => round($supportCenterCost + $scStaffCost, 2), // includes staff cost
                'net_profit'            => $netProfit,
                'profit_margin_percent' => $marginPct,
                'total_invoiced'        => $totalInvoiced,
                'total_paid'            => $totalPaid,
                'outstanding_balance'   => $outstanding,
                'calculated_at'         => now(),
            ]
        );
    }

    /**
     * Compute system-wide Financial Metrics for Dashboard & Reports.
     */
    public static function getGlobalFinancialSummary(?array $filters = []): array
    {
        $revQuery = PartnerRevenue::query();
        $costQuery = PartnerCost::query();
        $payQuery  = PartnerPayment::where('status', 'Completed');

        if (! empty($filters['partner_id'])) {
            $revQuery->where('partner_id', $filters['partner_id']);
            $costQuery->where('partner_id', $filters['partner_id']);
            $payQuery->where('partner_id', $filters['partner_id']);
        }

        if (! empty($filters['start_date']) && ! empty($filters['end_date'])) {
            $revQuery->whereBetween('revenue_date', [$filters['start_date'], $filters['end_date']]);
            $costQuery->whereBetween('cost_date', [$filters['start_date'], $filters['end_date']]);
            $payQuery->whereBetween('payment_date', [$filters['start_date'], $filters['end_date']]);
        }

        $totalRevenue = (float) $revQuery->sum('amount');
        $totalCost    = (float) $costQuery->sum('amount');
        $netProfit    = $totalRevenue - $totalCost;
        $totalPaid    = (float) $payQuery->sum('amount');
        $outstanding  = max(0, $totalRevenue - $totalPaid);
        $marginPct    = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0;

        $totalCommission = (float) PartnerCost::where('cost_type', 'Commission')->sum('amount');
        $totalInvestment = (float) PartnerRoi::sum('investment_amount');
        $avgRoi          = (float) PartnerRoi::avg('roi_percent') ?? 0;

        return [
            'total_revenue'    => $totalRevenue,
            'total_cost'       => $totalCost,
            'net_profit'       => $netProfit,
            'profit_margin_pct'=> $marginPct,
            'total_paid'       => $totalPaid,
            'outstanding'      => $outstanding,
            'total_commission' => $totalCommission,
            'total_investment' => $totalInvestment,
            'avg_roi'          => round($avgRoi, 2),
        ];
    }
}
