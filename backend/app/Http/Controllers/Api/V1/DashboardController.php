<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Bandwidth\PartnerBandwidthAllocation;
use App\Models\Commission\PartnerCommission;
use App\Models\Equipment\PartnerEndDevice;
use App\Models\Equipment\PartnerEquipment;
use App\Models\Financial\PartnerProfitLoss;
use App\Models\Financial\PartnerRoi;
use App\Models\Marketing\PartnerCustomerMetric;
use App\Models\Partner\Partner;
use App\Models\SupportCenter\PartnerSupportCenter;
use App\Services\FinancialCalculationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{

    public function summary(Request $request): JsonResponse
    {
        $partnerQuery = Partner::query();

        if ($type = $request->query('partner_type')) {
            $partnerQuery->where('partner_type', $type);
        }
        if ($status = $request->query('status')) {
            $partnerQuery->where('status', $status);
        }
        if ($areaId = $request->query('area_id')) {
            $partnerQuery->where('area_id', $areaId);
        }
        if ($zoneId = $request->query('zone_id')) {
            $partnerQuery->where('zone_id', $zoneId);
        }
        if ($amId = $request->query('account_manager_id')) {
            $partnerQuery->where('account_manager_id', $amId);
        }
        if ($partnerId = $request->query('partner_id')) {
            $partnerQuery->where('id', $partnerId);
        }
        if ($bmId = $request->query('business_model_id')) {
            $partnerQuery->whereHas('businessModels', function ($b) use ($bmId) {
                $b->where('business_models.id', $bmId);
            });
        }

        // Date range filters
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');

        if ($month = $request->query('month')) {
            $year = $request->query('year', now()->year);
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
            $endDate   = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();
        } elseif ($quarter = $request->query('quarter')) {
            $year = $request->query('year', now()->year);
            $startMonth = ($quarter - 1) * 3 + 1;
            $startDate = Carbon::createFromDate($year, $startMonth, 1)->startOfQuarter()->toDateString();
            $endDate   = Carbon::createFromDate($year, $startMonth, 1)->endOfQuarter()->toDateString();
        } elseif ($year = $request->query('year')) {
            $startDate = Carbon::createFromDate($year, 1, 1)->startOfYear()->toDateString();
            $endDate   = Carbon::createFromDate($year, 12, 31)->endOfYear()->toDateString();
        }

        // Target partner IDs matching the filters
        $filteredPartnerIds = (clone $partnerQuery)->pluck('id')->toArray();

        $totalPartners     = count($filteredPartnerIds);
        $activeCount       = (clone $partnerQuery)->where('status', 'Active')->count();
        $pendingCount      = (clone $partnerQuery)->whereIn('status', ['Pending Approval', 'Under Review'])->count();
        $suspendedCount    = (clone $partnerQuery)->whereIn('status', ['Suspended', 'Blocked'])->count();
        $inactiveCount     = (clone $partnerQuery)->where('status', 'Inactive')->count();
        $terminatedCount   = (clone $partnerQuery)->where('status', 'Terminated')->count();

        $newPartnersQuery = (clone $partnerQuery);
        if ($startDate && $endDate) {
            $newPartnersQuery->whereBetween('created_at', [$startDate, $endDate . ' 23:59:59']);
        } else {
            $newPartnersQuery->where('created_at', '>=', now()->startOfMonth());
        }
        $newPartnersCount = $newPartnersQuery->count();

        $finFilters = [
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ];
        if (!empty($request->query('partner_id'))) {
            $finFilters['partner_id'] = $request->query('partner_id');
        }

        $finSummary = FinancialCalculationService::getGlobalFinancialSummary($finFilters);

        $totalCommission = PartnerCommission::whereIn('partner_id', $filteredPartnerIds)->sum('commission_amount');
        $totalInvestment = PartnerRoi::whereIn('partner_id', $filteredPartnerIds)->sum('investment_amount');

        // Bandwidth
        $totalBandwidthMbps = (float) PartnerBandwidthAllocation::whereIn('partner_id', $filteredPartnerIds)
            ->where('status', 'Active')
            ->sum('allocated_mbps');

        $formattedBandwidth = $totalBandwidthMbps >= 1000
            ? round($totalBandwidthMbps / 1000, 2) . ' Gbps'
            : round($totalBandwidthMbps, 1) . ' Mbps';

        // End Devices
        $activeEndDevices = PartnerEndDevice::whereIn('partner_id', $filteredPartnerIds)
            ->where('status', 'Active')
            ->count();

        // Support Centers
        $activeSupportCenters = PartnerSupportCenter::whereIn('partner_id', $filteredPartnerIds)
            ->where('status', 'Active')
            ->count();

        // Equipment
        $totalEquipment = PartnerEquipment::whereIn('partner_id', $filteredPartnerIds)
            ->whereIn('status', ['Active', 'Installed', 'Assigned'])
            ->count();

        // Active Customers latest closing_customers for each partner)
        $totalActiveCustomers = (int) PartnerCustomerMetric::whereIn('partner_id', $filteredPartnerIds)
            ->whereIn('id', function ($query) {
                $query->selectRaw('MAX(id)')
                    ->from('partner_customer_metrics')
                    ->groupBy('partner_id');
            })
            ->sum('closing_customers');

        // Fallback to active end devices if no periodic customer snapshot exists yet
        if ($totalActiveCustomers === 0 && $activeEndDevices > 0) {
            $totalActiveCustomers = $activeEndDevices;
        }

        return response()->json([
            'partner_kpis' => [
                'total'      => $totalPartners,
                'active'     => $activeCount,
                'pending'    => $pendingCount,
                'suspended'  => $suspendedCount,
                'inactive'   => $inactiveCount,
                'terminated' => $terminatedCount,
                'new'        => $newPartnersCount,
            ],
            'financial_kpis' => array_merge($finSummary, [
                'total_commission' => (float) $totalCommission,
                'total_investment' => (float) $totalInvestment,
            ]),
            'operational_kpis' => [
                'total_bandwidth_mbps'    => $totalBandwidthMbps,
                'formatted_bandwidth'     => $formattedBandwidth,
                'active_end_devices'      => $activeEndDevices,
                'active_support_centers'  => $activeSupportCenters,
                'total_equipment'         => $totalEquipment,
                'total_active_customers'  => $totalActiveCustomers,
            ],
        ]);
    }
}
