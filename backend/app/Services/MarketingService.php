<?php

namespace App\Services;

use App\Models\Partner\Partner;
use App\Models\Marketing\PartnerCampaign;
use App\Models\Marketing\PartnerCustomerMetric;
use App\Models\Marketing\PartnerSalesMetric;
use App\Models\Marketing\PartnerPackageMetric;
use App\Models\Marketing\PartnerAreaMetric;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;

/**
 * Marketing & Sales Intelligence Service.
 */
class MarketingService
{

    public function getSummary(int|Partner $partner): array
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;

        $campaigns = PartnerCampaign::where('partner_id', $partnerId)->get();
        $latestCustomerMetric = PartnerCustomerMetric::where('partner_id', $partnerId)
            ->orderByDesc('metric_date')
            ->first();
        $latestSalesMetric = PartnerSalesMetric::where('partner_id', $partnerId)
            ->orderByDesc('metric_date')
            ->first();

        $totalCost = (float) $campaigns->sum('campaign_cost');
        $totalProfit = (float) $campaigns->sum('campaign_profit');
        $avgRoi = $totalCost > 0 ? round(($totalProfit / $totalCost) * 100, 2) : 0.00;

        return [
            'total_campaigns'        => $campaigns->count(),
            'active_campaigns'       => $campaigns->where('status', 'Active')->count(),
            'total_campaign_cost'    => $totalCost,
            'total_campaign_profit'  => $totalProfit,
            'avg_campaign_roi'       => $avgRoi,
            'current_customers'      => $latestCustomerMetric?->closing_customers ?? 0,
            'latest_growth_rate'     => $latestCustomerMetric?->growth_rate ?? 0.00,
            'latest_churn_rate'      => $latestCustomerMetric?->churn_rate ?? 0.00,
            'sales_achievement_rate' => $latestSalesMetric?->achievement_percentage ?? 0.00,
            'total_actual_sales'     => (float) ($latestSalesMetric?->actual_sales ?? 0),
        ];
    }


    public function getCustomerGrowth(int|Partner $partner)
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;

        return PartnerCustomerMetric::where('partner_id', $partnerId)
            ->orderByDesc('metric_date')
            ->get();
    }

    /**
     * Record or Sync Customer Metric with PRD formulas
     * Growth % = (New / Opening) * 100
     * Churn %  = (Terminated / Opening Active) * 100
     */
    public function recordCustomerMetric(int|Partner $partner, array $data): PartnerCustomerMetric
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;
        $data['partner_id'] = $partnerId;

        $opening = (int) ($data['opening_customers'] ?? 0);
        $new = (int) ($data['new_customers'] ?? 0);
        $terminated = (int) ($data['terminations'] ?? $data['churn_customers'] ?? 0);
        $reactivations = (int) ($data['reactivations'] ?? 0);
        $renewals = (int) ($data['renewals'] ?? 0);
        $suspensions = (int) ($data['suspensions'] ?? 0);

        // Calculate formulas
        $data['growth_rate'] = $opening > 0 ? round(($new / $opening) * 100, 2) : 0.00;
        $data['churn_rate']  = $opening > 0 ? round(($terminated / $opening) * 100, 2) : 0.00;
        $data['churn_customers'] = $terminated;
        $data['closing_customers'] = $data['closing_customers'] ?? ($opening + $new + $reactivations - $terminated);

        return PartnerCustomerMetric::updateOrCreate(
            [
                'partner_id'  => $partnerId,
                'metric_date' => $data['metric_date'],
                'period_type' => $data['period_type'] ?? 'Monthly',
            ],
            $data
        );
    }

    /**
     * Get Sales Performance Metrics
     */
    public function getSalesPerformance(int|Partner $partner)
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;

        return PartnerSalesMetric::where('partner_id', $partnerId)
            ->orderByDesc('metric_date')
            ->get();
    }

    /**
     * Record or Sync Sales Metric with PRD formula:
     * Achievement % = (Actual / Target) * 100
     */
    public function recordSalesMetric(int|Partner $partner, array $data): PartnerSalesMetric
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;
        $data['partner_id'] = $partnerId;

        $target = (float) ($data['sales_target'] ?? 0);
        $actual = (float) ($data['actual_sales'] ?? 0);

        $data['achievement_percentage'] = $target > 0 ? round(($actual / $target) * 100, 2) : 0.00;

        return PartnerSalesMetric::updateOrCreate(
            [
                'partner_id'  => $partnerId,
                'metric_date' => $data['metric_date'],
                'period_type' => $data['period_type'] ?? 'Monthly',
            ],
            $data
        );
    }

    /**
     * Get Package Performance
     */
    public function getPackagePerformance(int|Partner $partner)
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;

        return PartnerPackageMetric::where('partner_id', $partnerId)
            ->orderByDesc('metric_date')
            ->get();
    }

    /**
     * Get Area and Zone Metrics
     */
    public function getAreaMetrics(int|Partner $partner)
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;

        return PartnerAreaMetric::with(['area', 'zone'])
            ->where('partner_id', $partnerId)
            ->orderByDesc('metric_date')
            ->get();
    }

    /**
     * Get all campaigns for a partner
     */
    public function getCampaigns(int|Partner $partner)
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;

        return PartnerCampaign::where('partner_id', $partnerId)
            ->orderByDesc('start_date')
            ->get();
    }

    /**
     * Store a new campaign with ROI and Conversion formulas:
     * Campaign Profit = Actual Revenue - Campaign Cost
     * Campaign ROI % = (Profit / Cost) * 100
     * Conversion Rate % = (Actual Customers / Target Customers) * 100
     */
    public function storeCampaign(int|Partner $partner, array $data, ?int $userId = null): PartnerCampaign
    {
        $partnerId = $partner instanceof Partner ? $partner->id : $partner;
        $data['partner_id'] = $partnerId;
        $data['created_by'] = $userId;

        $cost = (float) ($data['campaign_cost'] ?? 0);
        $rev  = (float) ($data['actual_revenue'] ?? 0);
        $targetCust = (int) ($data['target_customers'] ?? 0);
        $actualCust = (int) ($data['actual_customers'] ?? 0);

        $profit = $rev - $cost;
        $data['campaign_profit'] = $profit;
        $data['roi'] = $cost > 0 ? round(($profit / $cost) * 100, 2) : 0.00;
        $data['conversion_rate'] = $targetCust > 0 ? round(($actualCust / $targetCust) * 100, 2) : 0.00;

        $campaign = PartnerCampaign::create($data);

        AuditLogService::log('created', $campaign, null, $campaign->toArray());

        return $campaign;
    }

    /**
     * Update an existing campaign
     */
    public function updateCampaign(int $campaignId, array $data, ?int $userId = null): PartnerCampaign
    {
        $campaign = PartnerCampaign::findOrFail($campaignId);
        $oldValues = $campaign->toArray();

        $cost = isset($data['campaign_cost']) ? (float) $data['campaign_cost'] : (float) $campaign->campaign_cost;
        $rev  = isset($data['actual_revenue']) ? (float) $data['actual_revenue'] : (float) $campaign->actual_revenue;
        $targetCust = isset($data['target_customers']) ? (int) $data['target_customers'] : (int) $campaign->target_customers;
        $actualCust = isset($data['actual_customers']) ? (int) $data['actual_customers'] : (int) $campaign->actual_customers;

        $profit = $rev - $cost;
        $data['campaign_profit'] = $profit;
        $data['roi'] = $cost > 0 ? round(($profit / $cost) * 100, 2) : 0.00;
        $data['conversion_rate'] = $targetCust > 0 ? round(($actualCust / $targetCust) * 100, 2) : 0.00;
        $data['updated_by'] = $userId;

        $campaign->update($data);

        AuditLogService::log('updated', $campaign, $oldValues, $campaign->toArray());

        return $campaign;
    }

    /**
     * Delete a campaign (Soft Delete)
     */
    public function destroyCampaign(int $campaignId): bool
    {
        $campaign = PartnerCampaign::findOrFail($campaignId);
        $old = $campaign->toArray();

        $campaign->delete();

        AuditLogService::log('deleted', $campaign, $old, null);

        return true;
    }
}
