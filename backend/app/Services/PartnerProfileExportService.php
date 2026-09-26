<?php

namespace App\Services;

use App\Models\Partner\Partner;
use App\Models\Partner\PartnerNote;
use Illuminate\Support\Carbon;


class PartnerProfileExportService
{
    public const SECTIONS = [
        'partner_information' => 'Partner Information',
        'business_information' => 'Business Information',
        'marketing'           => 'Marketing Analysis',
        'revenue'             => 'Revenue',
        'cost'                => 'Cost',
        'pnl'                 => 'Profit & Loss',
        'roi'                 => 'ROI',
        'bandwidth'           => 'Bandwidth',
        'bandwidth_history'   => 'Bandwidth History',
        'equipment'           => 'Equipment',
        'users_devices'       => 'Users & Devices',
        'commission'          => 'Commission',
        'support_centers'     => 'Support Centers',
        'documents'           => 'Documents',
        'health'              => 'Health',
        'risk'                => 'Risk',
        'insights'            => 'Management Insights',
        'history'             => 'History',
    ];


    public static function build(Partner $partner, array $sections, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $partner->load([
            'profile',
            'businessModels',
            'area',
            'zone',
            'territory',
            'accountManager:id,name',
            'relationshipManager:id,name',
            'riskIndicators',
            'insights',
        ]);

        $from = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
        $to   = $dateTo ? Carbon::parse($dateTo)->endOfDay() : now();

        $data = array_merge(
            ['partner_information' => self::partnerInformation($partner)],
            ['business_information' => self::businessInformation($partner)],
            ['marketing'           => self::marketing($partner)],
            ['revenue'             => self::revenue($partner, $from, $to)],
            ['cost'                => self::cost($partner, $from, $to)],
            ['pnl'                 => self::pnl($partner, $from, $to)],
            ['roi'                 => self::roi($partner)],
            ['bandwidth'           => self::bandwidth($partner)],
            ['bandwidth_history'   => self::bandwidthHistory($partner, $from, $to)],
            ['equipment'           => self::equipment($partner)],
            ['users_devices'       => self::usersDevices($partner)],
            ['commission'          => self::commission($partner, $from, $to)],
            ['support_centers'     => self::supportCenters($partner)],
            ['documents'           => self::documents($partner)],
            ['health'              => self::health($partner)],
            ['risk'                => self::risk($partner)],
            ['insights'            => self::insights($partner)],
            ['history'             => self::history($partner, $from, $to)],
        );

        $orderedSections = [];
        foreach (array_keys(self::SECTIONS) as $key) {
            if (in_array($key, $sections, true) && isset($data[$key])) {
                $orderedSections[$key] = $data[$key];
            }
        }

        return [
            'partner'      => [
                'id'           => $partner->id,
                'partner_id'   => $partner->partner_id,
                'partner_code' => $partner->partner_code,
                'partner_name' => $partner->partner_name,
                'status'       => $partner->status,
                'health_status' => $partner->health_status,
            ],
            'generated_at' => now()->toDateTimeString(),
            'period'       => [
                'date_from' => $from?->toDateString(),
                'date_to'   => $to?->toDateString(),
            ],
            'sections'     => $orderedSections,
            'rows'         => self::flattenToRows($orderedSections),
            'kpis'         => self::kpis($partner),
        ];
    }


    public static function flattenToRows(array $sections): array
    {
        $rows = [];

        foreach ($sections as $sectionKey => $fields) {
            $sectionLabel = self::SECTIONS[$sectionKey] ?? $sectionKey;

            foreach ($fields as $field => $value) {
                $rows[] = [
                    $sectionLabel,
                    is_string($field) ? ucwords(str_replace('_', ' ', $field)) : (string) $field,
                    self::stringify($value),
                ];
            }
        }

        return $rows;
    }

    private static function stringify(mixed $value): string
    {
        if (is_array($value)) {
            return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }
        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return (string) ($value ?? '—');
    }


    private static function partnerInformation(Partner $partner): array
    {
        return [
            'partner_id'      => $partner->partner_id,
            'partner_code'    => $partner->partner_code,
            'partner_name'    => $partner->partner_name,
            'legal_name'      => $partner->legal_name,
            'business_name'   => $partner->business_name,
            'partner_type'    => $partner->partner_type,
            'partner_category' => $partner->partner_category,
            'status'          => $partner->status,
            'partner_since'   => $partner->partner_since?->toDateString(),
            'account_manager' => $partner->accountManager?->name,
            'relationship_manager' => $partner->relationshipManager?->name,
            'area'            => $partner->area?->name,
            'zone'            => $partner->zone?->name,
            'health_status'   => $partner->health_status,
        ];
    }

    private static function businessInformation(Partner $partner): array
    {
        $profile = $partner->profile;

        return [
            'business_models'      => $partner->businessModels->pluck('name')->implode(', ') ?: '—',
            'business_type'        => $profile?->business_type,
            'business_category'    => $profile?->business_category,
            'operating_area'       => $profile?->operating_area ?? $partner->area?->name,
            'territory'            => $partner->territory?->name,
            'contract_type'        => $profile?->contract_type,
            'contract_start_date'  => optional($profile?->contract_start_date)->toDateString(),
            'contract_end_date'    => optional($profile?->contract_end_date)->toDateString(),
            'payment_terms'        => $profile?->payment_terms,
            'credit_limit'         => $profile?->credit_limit,
            'credit_days'          => $profile?->credit_days,
            'security_deposit'     => $profile?->security_deposit,
            'billing_cycle'        => $profile?->billing_cycle,
        ];
    }

    private static function marketing(Partner $partner): array
    {
        $summary = (new MarketingService())->getSummary($partner);

        return [
            'current_customers'      => $summary['current_customers'] ?? 0,
            'customer_growth_rate'   => $summary['latest_growth_rate'] ?? 0,
            'churn_rate'             => $summary['latest_churn_rate'] ?? 0,
            'total_campaigns'        => $summary['total_campaigns'] ?? 0,
            'active_campaigns'       => $summary['active_campaigns'] ?? 0,
            'total_campaign_cost'    => $summary['total_campaign_cost'] ?? 0,
            'total_campaign_profit'  => $summary['total_campaign_profit'] ?? 0,
            'avg_campaign_roi'       => $summary['avg_campaign_roi'] ?? 0,
            'sales_achievement_rate' => $summary['sales_achievement_rate'] ?? 0,
        ];
    }

    private static function revenue(Partner $partner, ?Carbon $from, Carbon $to): array
    {
        $query = $partner->revenues()->whereDate('revenue_date', '<=', $to);
        if ($from) {
            $query->whereDate('revenue_date', '>=', $from);
        }
        $rows = $query->get();

        return [
            'total_revenue'   => round((float) $rows->sum('amount'), 2),
            'transaction_count' => $rows->count(),
            'by_source'       => $rows->groupBy('revenue_source')->map(fn($g) => round((float) $g->sum('amount'), 2))->toArray(),
        ];
    }

    private static function cost(Partner $partner, ?Carbon $from, Carbon $to): array
    {
        $query = $partner->costs()->whereDate('cost_date', '<=', $to);
        if ($from) {
            $query->whereDate('cost_date', '>=', $from);
        }
        $rows = $query->get();

        return [
            'total_cost'        => round((float) $rows->sum('amount'), 2),
            'transaction_count' => $rows->count(),
            'by_type'           => $rows->groupBy('cost_type')->map(fn($g) => round((float) $g->sum('amount'), 2))->toArray(),
        ];
    }

    private static function pnl(Partner $partner, ?Carbon $from, Carbon $to): array
    {
        $pnl = FinancialCalculationService::calculatePnL($partner, $to->format('Y-m'));

        return [
            'total_revenue'         => (float) $pnl->total_revenue,
            'direct_cost'           => (float) $pnl->direct_cost,
            'gross_profit'          => (float) $pnl->gross_profit,
            'commission_cost'       => (float) $pnl->commission_cost,
            'support_center_cost'   => (float) $pnl->support_center_cost,
            'operating_cost'        => (float) $pnl->operating_cost,
            'net_profit'            => (float) $pnl->net_profit,
            'profit_margin_percent' => (float) $pnl->profit_margin_percent,
            'outstanding_balance'   => (float) $pnl->outstanding_balance,
        ];
    }

    private static function roi(Partner $partner): array
    {
        $rois = $partner->rois()->get();

        return [
            'total_investment' => round((float) $rois->sum('investment_amount'), 2),
            'total_return'     => round((float) $rois->sum('net_return_amount'), 2),
            'roi_percent'      => $rois->count() ? round((float) $rois->avg('roi_percent'), 2) : 0,
            'payback_months'   => $rois->count() ? round((float) $rois->avg('payback_period_months'), 2) : null,
        ];
    }

    private static function bandwidth(Partner $partner): array
    {
        $summary = BandwidthManagementService::getBandwidthSummary($partner);

        return [
            'total_allocated_mbps' => $summary['total_allocated_mbps'] ?? 0,
            'total_used_mbps'      => $summary['total_used_mbps'] ?? 0,
            'total_available_mbps' => $summary['total_available_mbps'] ?? 0,
            'utilization_percent'  => $summary['utilization_percent'] ?? 0,
            'monthly_revenue'      => $summary['monthly_revenue'] ?? 0,
            'monthly_cost'         => $summary['monthly_cost'] ?? 0,
            'monthly_profit'       => round((float) ($summary['monthly_revenue'] ?? 0) - (float) ($summary['monthly_cost'] ?? 0), 2),
            'pending_requests'     => $summary['pending_requests'] ?? 0,
        ];
    }

    private static function bandwidthHistory(Partner $partner, ?Carbon $from, Carbon $to): array
    {
        $query = $partner->bandwidthChanges()->whereDate('created_at', '<=', $to);
        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        $changes = $query->latest()->limit(50)->get();

        return [
            'total_changes' => $changes->count(),
            'changes'       => $changes->map(fn($c) => [
                'type'      => $c->change_type,
                'status'    => $c->status,
                'previous'  => $c->previous_mbps,
                'requested' => $c->requested_mbps,
                'date'      => $c->created_at?->toDateString(),
            ])->toArray(),
        ];
    }

    private static function equipment(Partner $partner): array
    {
        $equipment = $partner->equipments()->get();

        return [
            'total_equipment'   => $equipment->count(),
            'active_equipment'  => $equipment->where('status', 'Active')->count(),
            'total_investment'  => round((float) $equipment->sum('purchase_cost'), 2),
            'faulty_equipment'  => $equipment->whereIn('status', ['Faulty', 'Under Maintenance'])->count(),
        ];
    }

    private static function usersDevices(Partner $partner): array
    {
        $devices = $partner->endDevices()->get();

        return [
            'total_devices'  => $devices->count(),
            'active_devices' => $devices->where('status', 'Active')->count(),
            'offline_devices' => $devices->where('status', 'Offline')->count(),
        ];
    }

    private static function commission(Partner $partner, ?Carbon $from, Carbon $to): array
    {
        $query = $partner->commissions()->whereDate('created_at', '<=', $to);
        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        $rows = $query->get();

        return [
            'total_generated' => round((float) $rows->sum('commission_amount'), 2),
            'total_paid'      => round((float) $rows->where('status', 'Paid')->sum('commission_amount'), 2),
            'total_pending'   => round((float) $rows->whereIn('status', ['Pending', 'Calculated', 'Generated'])->sum('commission_amount'), 2),
            'total_approved'  => round((float) $rows->whereIn('status', ['Approved', 'Payable'])->sum('commission_amount'), 2),
        ];
    }

    private static function supportCenters(Partner $partner): array
    {
        $summary = SupportCenterManagementService::getSummary($partner);

        return [
            'total_centers'   => $summary['total_centers'] ?? 0,
            'active_centers'  => $summary['active_centers'] ?? 0,
            'total_staff'     => $summary['total_staff'] ?? 0,
            'monthly_op_cost' => $summary['monthly_operating_cost'] ?? 0,
        ];
    }

    private static function documents(Partner $partner): array
    {
        $documents = $partner->documents()->get();

        return [
            'total_documents' => $documents->count(),
            'active'          => $documents->where('status', 'Active')->count(),
            'expired'         => $documents->filter(fn($d) => $d->is_expired)->count(),
            'by_category'     => $documents->groupBy('category')->map->count()->toArray(),
        ];
    }

    private static function health(Partner $partner): array
    {
        return [
            'health_score'  => $partner->health_score,
            'health_status' => $partner->health_status,
        ];
    }

    private static function risk(Partner $partner): array
    {
        $risks = $partner->riskIndicators()->get();

        return [
            'total_risks' => $risks->count(),
            'high_risks'  => $risks->whereIn('risk_level', ['High', 'Critical'])->count(),
            'open_risks'  => $risks->where('status', '!=', 'Resolved')->count(),
            'by_category' => $risks->groupBy('risk_category')->map->count()->toArray(),
            'by_level'    => $risks->groupBy('risk_level')->map->count()->toArray(),
        ];
    }

    private static function insights(Partner $partner): array
    {
        $insights = $partner->insights()->orderByDesc('generated_at')->limit(20)->get();

        return [
            'total_insights' => $insights->count(),
            'unread'         => $insights->where('is_read', false)->count(),
            'insights'       => $insights->pluck('insight_text')->filter()->values()->toArray(),
        ];
    }

    private static function history(Partner $partner, ?Carbon $from, Carbon $to): array
    {
        $filters = ['date_to' => $to->toDateString()];
        if ($from) {
            $filters['date_from'] = $from->toDateString();
        }

        $events = TimelineService::query($partner, $filters)->latest('event_date')->limit(100)->get();

        return [
            'total_events' => $events->count(),
            'events'       => $events->map(fn($e) => [
                'date'      => $e->event_date?->toDateString(),
                'module'    => $e->module,
                'event'     => $e->event_type,
                'detail'    => $e->title,
            ])->toArray(),
        ];
    }

    private static function kpis(Partner $partner): array
    {
        $notes = PartnerNote::where('partner_id', $partner->id)->count();

        return [
            'total_documents' => $partner->documents()->count(),
            'total_notes'     => $notes,
            'total_events'    => $partner->timelineEvents()->count(),
        ];
    }
}
