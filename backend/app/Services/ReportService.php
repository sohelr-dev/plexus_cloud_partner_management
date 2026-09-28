<?php

namespace App\Services;

use App\Models\Bandwidth\PartnerBandwidthAllocation;
use App\Models\Commission\PartnerCommission;
use App\Models\Equipment\PartnerEquipment;
use App\Models\Financial\PartnerCost;
use App\Models\Financial\PartnerPayment;
use App\Models\Financial\PartnerProfitLoss;
use App\Models\Financial\PartnerRevenue;
use App\Models\Financial\PartnerRoi;
use App\Models\Marketing\PartnerCampaign;
use App\Models\Marketing\PartnerCustomerMetric;
use App\Models\Partner\Partner;
use App\Models\SupportCenter\PartnerSupportCenter;
use Illuminate\Support\Carbon;

class ReportService
{

    public const REPORT_TYPES = [
        'partner'        => 'Partner Performance Report',
        'financial'      => 'Financial & P&L Report',
        'marketing'      => 'Marketing & Customer Growth Report',
        'bandwidth'      => 'Bandwidth & Utilization Report',
        'equipment'      => 'Equipment & Asset Report',
        'commission'     => 'Commission & Payout Report',
        'support_center' => 'Support Center & Branch Report',
    ];


    public static function getPartnerReport(array $filters = []): array
    {
        $query = Partner::with(['businessModels', 'area', 'zone', 'latestHealthScore']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(fn($q) => $q->where('partner_name', 'like', "%{$s}%")->orWhere('partner_id', 'like', "%{$s}%"));
        }

        $partners = $query->get();

        $rows = [];
        $totalRevenue = 0;
        $totalCost = 0;
        $totalNetProfit = 0;
        $activeCount = 0;

        foreach ($partners as $p) {
            $rev = PartnerRevenue::where('partner_id', $p->id)->sum('amount') ?: 0;
            $cost = PartnerCost::where('partner_id', $p->id)->sum('amount') ?: 0;
            $net = $rev - $cost;
            $roi = (float) (PartnerRoi::where('partner_id', $p->id)->latest('snapshot_date')->value('roi_percent') ?? 0);
            $health = $p->latestHealthScore;

            if ($p->status === 'Active') {
                $activeCount++;
            }

            $totalRevenue += $rev;
            $totalCost += $cost;
            $totalNetProfit += $net;

            $rows[] = [
                'partner_id'       => $p->partner_id,
                'partner_name'     => $p->partner_name,
                'business_models'  => $p->businessModels->pluck('name')->implode(', ') ?: 'N/A',
                'status'           => $p->status,
                'area_zone'        => ($p->area?->name ?? '') . ($p->zone ? ' / ' . $p->zone->name : ''),
                'revenue'          => (float) $rev,
                'cost'             => (float) $cost,
                'net_profit'       => (float) $net,
                'roi_percentage'   => (float) $roi,
                'health_score'     => $health?->score ?? (int) $p->health_score ?? 0,
                'health_status'    => $health?->status ?? $p->health_status ?? 'N/A',
            ];
        }

        return [
            'summary' => [
                'total_partners'   => count($partners),
                'active_partners'  => $activeCount,
                'total_revenue'    => $totalRevenue,
                'total_cost'       => $totalCost,
                'total_net_profit' => $totalNetProfit,
                'avg_health_score' => count($rows) ? round(collect($rows)->avg('health_score'), 1) : 0,
            ],
            'columns' => [
                ['key' => 'partner_id',      'label' => 'Partner ID'],
                ['key' => 'partner_name',    'label' => 'Partner Name'],
                ['key' => 'business_models', 'label' => 'Business Models'],
                ['key' => 'status',          'label' => 'Status'],
                ['key' => 'revenue',         'label' => 'Revenue (৳)',      'format' => 'currency'],
                ['key' => 'cost',            'label' => 'Cost (৳)',         'format' => 'currency'],
                ['key' => 'net_profit',      'label' => 'Net Profit (৳)',   'format' => 'currency'],
                ['key' => 'roi_percentage',  'label' => 'ROI %',            'format' => 'percentage'],
                ['key' => 'health_score',    'label' => 'Health Score',     'format' => 'score'],
            ],
            'rows' => $rows,
        ];
    }


    public static function getFinancialReport(array $filters = []): array
    {
        $from = !empty($filters['date_from']) ? Carbon::parse($filters['date_from'])->startOfDay() : null;
        $to   = !empty($filters['date_to']) ? Carbon::parse($filters['date_to'])->endOfDay() : null;

        $revQuery = PartnerRevenue::with('partner:id,partner_id,partner_name');
        $costQuery = PartnerCost::with('partner:id,partner_id,partner_name');
        $payQuery = PartnerPayment::with('partner:id,partner_id,partner_name');

        if (!empty($filters['partner_id'])) {
            $revQuery->where('partner_id', $filters['partner_id']);
            $costQuery->where('partner_id', $filters['partner_id']);
            $payQuery->where('partner_id', $filters['partner_id']);
        }
        if ($from) {
            $revQuery->where('revenue_date', '>=', $from);
            $costQuery->where('cost_date', '>=', $from);
            $payQuery->where('payment_date', '>=', $from);
        }
        if ($to) {
            $revQuery->where('revenue_date', '<=', $to);
            $costQuery->where('cost_date', '<=', $to);
            $payQuery->where('payment_date', '<=', $to);
        }

        $revenues = $revQuery->get();
        $costs = $costQuery->get();
        $payments = $payQuery->get();

        $totalRevenue = $revenues->sum('amount');
        $totalCost = $costs->sum('amount');
        $totalPaid = $payments->where('status', 'Completed')->sum('amount');
        $outstanding = max(0, $totalRevenue - $totalPaid);
        $netProfit = $totalRevenue - $totalCost;

        $partnerGroups = [];
        foreach ($revenues as $r) {
            $pid = $r->partner_id;
            $partnerGroups[$pid]['partner_id'] = $r->partner?->partner_id ?? "PT-{$pid}";
            $partnerGroups[$pid]['partner_name'] = $r->partner?->partner_name ?? 'Unknown';
            $partnerGroups[$pid]['revenue'] = ($partnerGroups[$pid]['revenue'] ?? 0) + $r->amount;
        }
        foreach ($costs as $c) {
            $pid = $c->partner_id;
            $partnerGroups[$pid]['partner_id'] = $partnerGroups[$pid]['partner_id'] ?? ($c->partner?->partner_id ?? "PT-{$pid}");
            $partnerGroups[$pid]['partner_name'] = $partnerGroups[$pid]['partner_name'] ?? ($c->partner?->partner_name ?? 'Unknown');
            $partnerGroups[$pid]['cost'] = ($partnerGroups[$pid]['cost'] ?? 0) + $c->amount;
        }
        foreach ($payments as $p) {
            if ($p->status === 'Completed') {
                $pid = $p->partner_id;
                $partnerGroups[$pid]['paid'] = ($partnerGroups[$pid]['paid'] ?? 0) + $p->amount;
            }
        }

        $rows = [];
        foreach ($partnerGroups as $pid => $item) {
            $rev = $item['revenue'] ?? 0;
            $cst = $item['cost'] ?? 0;
            $pd  = $item['paid'] ?? 0;
            $net = $rev - $cst;
            $out = max(0, $rev - $pd);
            $margin = $rev > 0 ? round(($net / $rev) * 100, 1) : 0;

            $rows[] = [
                'partner_id'     => $item['partner_id'],
                'partner_name'   => $item['partner_name'],
                'revenue'        => (float) $rev,
                'cost'           => (float) $cst,
                'net_profit'     => (float) $net,
                'profit_margin'  => (float) $margin,
                'paid'           => (float) $pd,
                'outstanding'    => (float) $out,
            ];
        }

        return [
            'summary' => [
                'total_revenue'     => (float) $totalRevenue,
                'total_cost'        => (float) $totalCost,
                'net_profit'        => (float) $netProfit,
                'total_paid'        => (float) $totalPaid,
                'total_outstanding' => (float) $outstanding,
                'avg_profit_margin' => $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 1) : 0,
            ],
            'columns' => [
                ['key' => 'partner_id',    'label' => 'Partner ID'],
                ['key' => 'partner_name',  'label' => 'Partner Name'],
                ['key' => 'revenue',       'label' => 'Revenue (৳)',      'format' => 'currency'],
                ['key' => 'cost',          'label' => 'Cost (৳)',         'format' => 'currency'],
                ['key' => 'net_profit',    'label' => 'Net Profit (৳)',   'format' => 'currency'],
                ['key' => 'profit_margin', 'label' => 'Margin %',         'format' => 'percentage'],
                ['key' => 'paid',          'label' => 'Total Paid (৳)',   'format' => 'currency'],
                ['key' => 'outstanding',   'label' => 'Outstanding (৳)',  'format' => 'currency'],
            ],
            'rows' => $rows,
        ];
    }


    public static function getMarketingReport(array $filters = []): array
    {
        $query = PartnerCustomerMetric::with('partner:id,partner_id,partner_name')
            ->latest('metric_date');

        if (!empty($filters['partner_id'])) {
            $query->where('partner_id', $filters['partner_id']);
        }

        $metrics = $query->limit(50)->get();

        $rows = [];
        foreach ($metrics as $m) {
            $churnCustomers = (int) ($m->churn_customers ?? $m->churned_customers ?? 0);
            $growth = $m->opening_customers > 0 
                ? round((($m->new_customers - $churnCustomers) / $m->opening_customers) * 100, 2)
                : 0;
            $churnRate = $m->opening_customers > 0 
                ? round(($churnCustomers / $m->opening_customers) * 100, 2)
                : 0;

            $rows[] = [
                'partner_id'        => $m->partner?->partner_id ?? "PT-{$m->partner_id}",
                'partner_name'      => $m->partner?->partner_name ?? 'Unknown',
                'month_year'        => Carbon::parse($m->metric_date)->format('M Y'),
                'active_customers'  => (int) ($m->closing_customers ?? $m->opening_customers ?? 0),
                'new_customers'     => (int) $m->new_customers,
                'churned_customers' => $churnCustomers,
                'net_growth_pct'    => (float) $growth,
                'churn_rate_pct'    => (float) $churnRate,
            ];
        }
        $totalActive = collect($rows)->sum('active_customers');
        $totalNew = collect($rows)->sum('new_customers');
        $totalChurn = collect($rows)->sum('churned_customers');

        return [
            'summary' => [
                'total_active_customers' => $totalActive,
                'total_new_acquisitions' => $totalNew,
                'total_churned'          => $totalChurn,
                'avg_churn_rate'         => count($rows) ? round(collect($rows)->avg('churn_rate_pct'), 2) : 0,
            ],
            'columns' => [
                ['key' => 'partner_id',        'label' => 'Partner ID'],
                ['key' => 'partner_name',      'label' => 'Partner Name'],
                ['key' => 'month_year',        'label' => 'Month / Year'],
                ['key' => 'active_customers',  'label' => 'Active Customers', 'format' => 'number'],
                ['key' => 'new_customers',     'label' => 'New Customers',    'format' => 'number'],
                ['key' => 'churned_customers', 'label' => 'Churned',          'format' => 'number'],
                ['key' => 'net_growth_pct',    'label' => 'Net Growth %',     'format' => 'percentage'],
                ['key' => 'churn_rate_pct',    'label' => 'Churn Rate %',     'format' => 'percentage'],
            ],
            'rows' => $rows,
        ];
    }


    public static function getBandwidthReport(array $filters = []): array
    {
        $query = PartnerBandwidthAllocation::with('partner:id,partner_id,partner_name');

        if (!empty($filters['partner_id'])) {
            $query->where('partner_id', $filters['partner_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $allocations = $query->get();

        $rows = [];
        $totalAllocated = 0;
        $totalUsage = 0;

        foreach ($allocations as $a) {
            $allocated = (float) $a->allocated_mbps;
            $usage = (float) ($a->used_mbps ?? ($allocated * 0.75));
            $utilization = (float) ($a->utilization_percent ?? ($allocated > 0 ? round(($usage / $allocated) * 100, 1) : 0));

            $totalAllocated += $allocated;
            $totalUsage += $usage;

            $rows[] = [
                'partner_id'     => $a->partner?->partner_id ?? "PT-{$a->partner_id}",
                'partner_name'   => $a->partner?->partner_name ?? 'Unknown',
                'service_type'   => $a->service ?? 'Internet Bandwidth',
                'allocated_mbps' => $allocated,
                'usage_mbps'     => $usage,
                'utilization'    => $utilization,
                'unit_price'     => (float) ($a->price ?? 0),
                'total_cost'     => (float) ($a->cost ?? 0),
                'status'         => $a->status,
            ];
        }

        return [
            'summary' => [
                'total_allocated_mbps' => $totalAllocated,
                'total_usage_mbps'     => $totalUsage,
                'avg_utilization_pct'  => $totalAllocated > 0 ? round(($totalUsage / $totalAllocated) * 100, 1) : 0,
                'total_allocations'    => count($allocations),
            ],
            'columns' => [
                ['key' => 'partner_id',     'label' => 'Partner ID'],
                ['key' => 'partner_name',   'label' => 'Partner Name'],
                ['key' => 'service_type',   'label' => 'Service Type'],
                ['key' => 'allocated_mbps', 'label' => 'Allocated (Mbps)', 'format' => 'number'],
                ['key' => 'usage_mbps',     'label' => 'Usage (Mbps)',     'format' => 'number'],
                ['key' => 'utilization',    'label' => 'Utilization %',    'format' => 'percentage'],
                ['key' => 'unit_price',     'label' => 'Unit Price (৳)',   'format' => 'currency'],
                ['key' => 'status',         'label' => 'Status'],
            ],
            'rows' => $rows,
        ];
    }

    public static function getEquipmentReport(array $filters = []): array
    {
        $query = PartnerEquipment::with('partner:id,partner_id,partner_name');

        if (!empty($filters['partner_id'])) {
            $query->where('partner_id', $filters['partner_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $equipments = $query->get();

        $rows = [];
        $expiringCount = 0;
        $totalCost = 0;

        foreach ($equipments as $e) {
            $isExpiring = $e->warranty_end && Carbon::parse($e->warranty_end)->between(now(), now()->addDays(30));
            if ($isExpiring) {
                $expiringCount++;
            }
            $totalCost += (float) ($e->purchase_cost ?? 0);

            $rows[] = [
                'equipment_tag' => $e->equipment_id ?? $e->asset_id ?? $e->serial_number ?? "EQ-{$e->id}",
                'partner_id'    => $e->partner?->partner_id ?? ($e->partner_id ? "PT-{$e->partner_id}" : 'Unassigned'),
                'partner_name'  => $e->partner?->partner_name ?? 'In Warehouse',
                'name'          => $e->model ?? $e->equipment_type ?? 'Network Gear',
                'category'      => $e->equipment_type ?? 'Router/Switch',
                'ownership'     => $e->ownership ?? 'Company Owned',
                'status'        => $e->status,
                'warranty_end'  => $e->warranty_end ? Carbon::parse($e->warranty_end)->format('d M Y') : 'N/A',
                'cost'          => (float) ($e->purchase_cost ?? 0),
            ];
        }

        return [
            'summary' => [
                'total_devices'       => count($equipments),
                'assigned_devices'    => collect($rows)->where('status', 'Assigned')->count(),
                'warranty_expiring'   => $expiringCount,
                'total_asset_value'   => $totalCost,
            ],
            'columns' => [
                ['key' => 'equipment_tag', 'label' => 'Serial / Tag'],
                ['key' => 'partner_name',  'label' => 'Assigned Partner'],
                ['key' => 'name',          'label' => 'Model / Name'],
                ['key' => 'category',      'label' => 'Category'],
                ['key' => 'ownership',     'label' => 'Ownership'],
                ['key' => 'status',        'label' => 'Status'],
                ['key' => 'warranty_end',  'label' => 'Warranty Expiry'],
                ['key' => 'cost',          'label' => 'Value (৳)', 'format' => 'currency'],
            ],
            'rows' => $rows,
        ];
    }


    public static function getCommissionReport(array $filters = []): array
    {
        $query = PartnerCommission::with('partner:id,partner_id,partner_name');

        if (!empty($filters['partner_id'])) {
            $query->where('partner_id', $filters['partner_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $commissions = $query->get();

        $rows = [];
        $totalGenerated = 0;
        $totalApproved = 0;
        $totalPaid = 0;
        $totalPending = 0;

        foreach ($commissions as $c) {
            $amt = (float) $c->commission_amount;
            $totalGenerated += $amt;

            if ($c->status === 'Paid') {
                $totalPaid += $amt;
            } elseif ($c->status === 'Approved') {
                $totalApproved += $amt;
            } elseif (in_array($c->status, ['Generated', 'Pending', 'Calculated'])) {
                $totalPending += $amt;
            }

            $periodLabel = ($c->period_month && $c->period_year)
                ? "{$c->period_month}/{$c->period_year}"
                : ($c->period ?? 'Monthly');
            $baseRev = (float) ($c->source_amount ?? $c->base_revenue ?? 0);
            $rate = $baseRev > 0 ? round(($amt / $baseRev) * 100, 1) : (float) ($c->rate ?? 0);

            $rows[] = [
                'partner_id'    => $c->partner?->partner_id ?? "PT-{$c->partner_id}",
                'partner_name'  => $c->partner?->partner_name ?? 'Unknown',
                'period'        => $periodLabel,
                'base_revenue'  => $baseRev,
                'rate'          => $rate,
                'commission'    => $amt,
                'status'        => $c->status,
                'calculated_at' => $c->generated_at ? Carbon::parse($c->generated_at)->format('d M Y') : ($c->calculated_at ? Carbon::parse($c->calculated_at)->format('d M Y') : 'N/A'),
            ];
        }

        return [
            'summary' => [
                'total_generated' => $totalGenerated,
                'total_approved'  => $totalApproved,
                'total_paid'      => $totalPaid,
                'total_pending'   => $totalPending,
            ],
            'columns' => [
                ['key' => 'partner_id',    'label' => 'Partner ID'],
                ['key' => 'partner_name',  'label' => 'Partner Name'],
                ['key' => 'period',        'label' => 'Period'],
                ['key' => 'base_revenue',  'label' => 'Base Revenue (৳)', 'format' => 'currency'],
                ['key' => 'rate',          'label' => 'Rate %',           'format' => 'percentage'],
                ['key' => 'commission',    'label' => 'Commission (৳)',   'format' => 'currency'],
                ['key' => 'status',        'label' => 'Status'],
            ],
            'rows' => $rows,
        ];
    }

    public static function getSupportCenterReport(array $filters = []): array
    {
        $query = PartnerSupportCenter::with('partner:id,partner_id,partner_name');

        if (!empty($filters['partner_id'])) {
            $query->where('partner_id', $filters['partner_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $branches = $query->get();

        $rows = [];
        $totalStaff = 0;
        $totalCost = 0;

        foreach ($branches as $b) {
            $staff = (int) ($b->staff_count ?? 0);
            $cost = (float) ($b->monthly_operating_cost ?? 0);
            $totalStaff += $staff;
            $totalCost += $cost;

            $rows[] = [
                'branch_code'      => $b->branch_code ?? $b->sc_id ?? "SC-{$b->id}",
                'branch_name'      => $b->center_name ?? $b->branch_name ?? 'Support Center',
                'partner_id'       => $b->partner?->partner_id ?? "PT-{$b->partner_id}",
                'partner_name'     => $b->partner?->partner_name ?? 'Unknown',
                'branch_type'      => $b->branch_type ?? 'Full Service Branch',
                'status'           => $b->status,
                'staff_count'      => $staff,
                'monthly_cost'     => $cost,
                'coverage_area'    => $b->service_coverage ?? $b->coverage_area ?? 'Local Zone',
            ];
        }

        return [
            'summary' => [
                'total_branches'       => count($branches),
                'active_branches'      => collect($rows)->where('status', 'Active')->count(),
                'total_staff'          => $totalStaff,
                'total_monthly_cost'   => $totalCost,
            ],
            'columns' => [
                ['key' => 'branch_code',   'label' => 'Branch Code'],
                ['key' => 'branch_name',   'label' => 'Branch Name'],
                ['key' => 'partner_name',  'label' => 'Partner Name'],
                ['key' => 'branch_type',   'label' => 'Branch Type'],
                ['key' => 'status',        'label' => 'Status'],
                ['key' => 'staff_count',   'label' => 'Staff Count',          'format' => 'number'],
                ['key' => 'monthly_cost',  'label' => 'Monthly Cost (৳)',     'format' => 'currency'],
            ],
            'rows' => $rows,
        ];
    }
}
