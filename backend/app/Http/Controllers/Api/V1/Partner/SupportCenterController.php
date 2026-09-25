<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Partner\Partner;
use App\Models\SupportCenter\PartnerSupportCenter;
use App\Models\SupportCenter\PartnerSupportCenterCost;
use App\Models\SupportCenter\PartnerSupportCenterEquipment;
use App\Models\SupportCenter\PartnerSupportCenterService;
use App\Models\SupportCenter\PartnerSupportCenterStaff;
use App\Services\SupportCenterManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Support Center (Branch) Module
 */
class SupportCenterController extends ApiController
{

    public function index(Partner $partner): JsonResponse
    {
        return $this->success(
            SupportCenterManagementService::getSummary($partner),
            'Support Center summary loaded.'
        );
    }

    public function store(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'center_name'        => 'required|string|max:255',
            'branch_type'        => 'nullable|string|in:Head Office,Branch,Support Center,Franchise',
            'address'            => 'nullable|string|max:1000',
            'area_id'            => 'nullable|integer|exists:areas,id',
            'zone_id'            => 'nullable|integer|exists:zones,id',
            'contact_number'     => 'nullable|string|max:50',
            'email'              => 'nullable|email|max:255',
            'branch_manager_id'  => 'nullable|integer|exists:users,id',
            'working_hours'      => 'nullable|string|max:100',
            'weekly_off_day'     => 'nullable|string|max:50',
            'opening_date'       => 'nullable|date',
            'service_coverage'   => 'nullable|string|max:1000',
            'status'             => 'nullable|string|in:Planned,Active,Temporarily Closed,Suspended,Closed',
        ]);

        $center = SupportCenterManagementService::createCenter($partner, $validated, $request->user());

        return $this->success($center, 'Support Center created.', 201);
    }

    public function update(Request $request, PartnerSupportCenter $center): JsonResponse
    {
        $validated = $request->validate([
            'center_name'        => 'sometimes|required|string|max:255',
            'branch_type'        => 'nullable|string|in:Head Office,Branch,Support Center,Franchise',
            'address'            => 'nullable|string|max:1000',
            'area_id'            => 'nullable|integer|exists:areas,id',
            'zone_id'            => 'nullable|integer|exists:zones,id',
            'contact_number'     => 'nullable|string|max:50',
            'email'              => 'nullable|email|max:255',
            'branch_manager_id'  => 'nullable|integer|exists:users,id',
            'working_hours'      => 'nullable|string|max:100',
            'weekly_off_day'     => 'nullable|string|max:50',
            'opening_date'       => 'nullable|date',
            'service_coverage'   => 'nullable|string|max:1000',
        ]);

        return $this->success(
            SupportCenterManagementService::updateCenter($center, $validated, $request->user()),
            'Support Center updated.'
        );
    }


    public function changeStatus(Request $request, PartnerSupportCenter $center): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Planned,Active,Temporarily Closed,Suspended,Closed',
            'reason' => 'nullable|string|max:500',
        ]);

        return $this->success(
            SupportCenterManagementService::changeStatus($center, $validated['status'], $validated['reason'] ?? null, $request->user()),
            "Support Center status changed to {$validated['status']}."
        );
    }

    public function staff(PartnerSupportCenter $center): JsonResponse
    {
        $staff = $center->staff()->orderBy('staff_category')->get();

        return $this->success([
            'total_staff'        => $staff->where('status', '!=', 'Resigned')->where('status', '!=', 'Terminated')->count(),
            'active_staff'       => $staff->where('status', 'Active')->count(),
            'vacant_positions'   => $staff->where('status', 'Vacant')->count(),
            'monthly_staff_cost' => (float) $staff->where('status', 'Active')->sum('monthly_cost'),
            'staff'              => $staff,
        ], 'Branch staff loaded.');
    }

    public function storeStaff(Request $request, PartnerSupportCenter $center): JsonResponse
    {
        $validated = $request->validate([
            'staff_name'      => 'nullable|string|max:255',
            'staff_category'  => 'required|string|in:Branch Manager,Customer Service,Technical Staff,Sales Staff,Marketing Staff,Accounts Staff,Other Staff',
            'designation'     => 'nullable|string|max:100',
            'contact_number'  => 'nullable|string|max:50',
            'email'           => 'nullable|email|max:255',
            'joining_date'    => 'nullable|date',
            'monthly_cost'    => 'nullable|numeric|min:0',
            'status'          => 'nullable|string|in:Active,Vacant,Resigned,Terminated',
        ]);

        $staff = SupportCenterManagementService::addStaff($center, $validated, $request->user());

        return $this->success($staff, 'Staff added.', 201);
    }

    public function services(PartnerSupportCenter $center): JsonResponse
    {
        return $this->success($center->services()->with(['zone', 'territory'])->get(), 'Service coverage loaded.');
    }
    public function storeService(Request $request, PartnerSupportCenter $center): JsonResponse
    {
        $validated = $request->validate([
            'service_area'       => 'nullable|string|max:1000',
            'zone_id'            => 'nullable|integer|exists:zones,id',
            'territory_id'       => 'nullable|integer|exists:territories,id',
            'coverage_area'      => 'nullable|string|max:1000',
            'supported_services' => 'nullable|string|max:1000',
            'customer_capacity'  => 'nullable|integer|min:0',
        ]);

        $service = $center->services()->create($validated);

        $coverage = $validated['service_area'] ?? 'N/A';
        SupportCenterManagementService::logHistory($center, 'Coverage Changed', "Service coverage added: {$coverage}.", $request->user());

        return $this->success($service, 'Service coverage added.', 201);
    }

    public function equipment(PartnerSupportCenter $center): JsonResponse
    {
        return $this->success($center->equipment()->get(), 'Branch equipment loaded.');
    }

    public function storeEquipment(Request $request, PartnerSupportCenter $center): JsonResponse
    {
        $validated = $request->validate([
            'equipment_id'   => 'nullable|integer|exists:partner_equipment,id',
            'equipment_type' => 'required|string|max:50',
            'quantity'       => 'nullable|integer|min:1',
            'status'         => 'nullable|string|max:50',
        ]);

        $eq = SupportCenterManagementService::addEquipment($center, $validated, $request->user());

        return $this->success($eq, 'Branch equipment added.', 201);
    }

    public function costs(PartnerSupportCenter $center): JsonResponse
    {
        $costs = $center->costs()->orderByDesc('cost_date')->get();

        return $this->success([
            'total_cost' => (float) $costs->sum('amount'),
            'this_month' => (float) $costs->where('cost_date', '>=', now()->startOfMonth()->toDateString())->sum('amount'),
            'by_type'    => $costs->groupBy('cost_type')->map->sum('amount'),
            'costs'      => $costs,
        ], 'Operating costs loaded.');
    }

    public function storeCost(Request $request, PartnerSupportCenter $center): JsonResponse
    {
        $validated = $request->validate([
            'cost_date'   => 'required|date',
            'cost_type'   => 'required|string|in:Rent,Electricity,Internet,Staff Cost,Equipment Cost,Maintenance,Transportation,Marketing,Other',
            'amount'      => 'required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
        ]);

        $cost = SupportCenterManagementService::addCost($center, $validated, $request->user());

        return $this->success($cost, 'Operating cost recorded (mirrored to partner P&L).', 201);
    }

    public function updateStaff(Request $request, PartnerSupportCenterStaff $staff): JsonResponse
    {
        $validated = $request->validate([
            'staff_name'      => 'nullable|string|max:255',
            'staff_category'  => 'nullable|string|in:Branch Manager,Customer Service,Technical Staff,Sales Staff,Marketing Staff,Accounts Staff,Other Staff',
            'designation'     => 'nullable|string|max:100',
            'contact_number'  => 'nullable|string|max:50',
            'email'           => 'nullable|email|max:255',
            'joining_date'    => 'nullable|date',
            'monthly_cost'    => 'nullable|numeric|min:0',
            'status'          => 'nullable|string|in:Active,Vacant,Resigned,Terminated',
        ]);

        return $this->success(
            SupportCenterManagementService::updateStaff($staff, $validated, $request->user()),
            'Staff updated.'
        );
    }

    public function deleteStaff(Request $request, PartnerSupportCenterStaff $staff): JsonResponse
    {
        SupportCenterManagementService::deleteStaff($staff, $request->user());

        return $this->success(null, 'Staff removed.');
    }

    public function updateService(Request $request, PartnerSupportCenterService $service): JsonResponse
    {
        $validated = $request->validate([
            'service_area'       => 'nullable|string|max:1000',
            'zone_id'            => 'nullable|integer|exists:zones,id',
            'territory_id'       => 'nullable|integer|exists:territories,id',
            'coverage_area'      => 'nullable|string|max:1000',
            'supported_services' => 'nullable|string|max:1000',
            'customer_capacity'  => 'nullable|integer|min:0',
        ]);

        $service->update($validated);

        $coverage = $validated['service_area'] ?? 'N/A';
        SupportCenterManagementService::logHistory($service->center, 'Coverage Changed', "Service coverage updated: {$coverage}.", $request->user());

        return $this->success($service->fresh(), 'Service coverage updated.');
    }

    public function deleteService(Request $request, PartnerSupportCenterService $service): JsonResponse
    {
        $service->delete();

        SupportCenterManagementService::logHistory($service->center, 'Coverage Changed', "Service coverage removed: {$service->service_area}.", $request->user());

        return $this->success(null, 'Service coverage removed.');
    }

    public function updateEquipment(Request $request, PartnerSupportCenterEquipment $equipment): JsonResponse
    {
        $validated = $request->validate([
            'equipment_id'   => 'nullable|integer|exists:partner_equipment,id',
            'equipment_type' => 'nullable|string|max:50',
            'quantity'       => 'nullable|integer|min:1',
            'status'         => 'nullable|string|max:50',
        ]);

        return $this->success(
            SupportCenterManagementService::updateEquipment($equipment, $validated, $request->user()),
            'Branch equipment updated.'
        );
    }

    public function deleteEquipment(Request $request, PartnerSupportCenterEquipment $equipment): JsonResponse
    {
        SupportCenterManagementService::deleteEquipment($equipment, $request->user());

        return $this->success(null, 'Branch equipment removed.');
    }

    public function updateCost(Request $request, PartnerSupportCenterCost $cost): JsonResponse
    {
        $validated = $request->validate([
            'cost_date'   => 'nullable|date',
            'cost_type'   => 'nullable|string|in:Rent,Electricity,Internet,Staff Cost,Equipment Cost,Maintenance,Transportation,Marketing,Other',
            'amount'      => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:1000',
        ]);

        return $this->success(
            SupportCenterManagementService::updateCost($cost, $validated, $request->user()),
            'Operating cost updated (re-mirrored to partner P&L).'
        );
    }

    public function deleteCost(Request $request, PartnerSupportCenterCost $cost): JsonResponse
    {
        SupportCenterManagementService::deleteCost($cost, $request->user());

        return $this->success(null, 'Operating cost removed (re-mirrored to partner P&L).');
    }

    public function performance(PartnerSupportCenter $center): JsonResponse
    {
        $partner = $center->partner;
        $summary = SupportCenterManagementService::getSummary($partner);
        $centerWithPerf = collect($summary['centers'])->firstWhere('id', $center->id);

        return $this->success([
            'performance'  => $centerWithPerf?->performance ?? [],
            'history'      => $center->history()->with('performedBy')->get(),
        ], 'Branch performance loaded.');
    }

    public function history(PartnerSupportCenter $center): JsonResponse
    {
        return $this->success($center->history()->with('performedBy')->get(), 'Branch history loaded.');
    }

    /**
     * Summarises all SC branches across all partners.
     */
    public function globalDashboard(Request $request): JsonResponse
    {
        $query = PartnerSupportCenter::with(['partner:id,partner_name,partner_code', 'staff', 'costs', 'equipment', 'services']);

        // Optional filters
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($partnerId = $request->query('partner_id')) {
            $query->where('partner_id', $partnerId);
        }

        $centers = $query->orderBy('status')->orderBy('center_name')->get();

        $thisMonthStart = now()->startOfMonth()->toDateString();

        $summary = [
            'total_centers'        => $centers->count(),
            'active_centers'       => $centers->where('status', 'Active')->count(),
            'planned_centers'      => $centers->where('status', 'Planned')->count(),
            'closed_centers'       => $centers->whereIn('status', ['Closed', 'Suspended', 'Temporarily Closed'])->count(),
            'total_staff'          => $centers->sum(fn ($c) => $c->staff->whereNotIn('status', ['Resigned', 'Terminated'])->count()),
            'total_monthly_staff_cost' => round($centers->sum(fn ($c) => $c->staff->where('status', 'Active')->sum('monthly_cost')), 2),
            'total_monthly_op_cost'    => round($centers->sum(fn ($c) => $c->costs->where('cost_date', '>=', $thisMonthStart)->sum('amount')), 2),
        ];

        $centerList = $centers->map(function ($center) use ($thisMonthStart) {
            $staffCost = (float) $center->staff->where('status', 'Active')->sum('monthly_cost');
            $opCost    = (float) $center->costs->where('cost_date', '>=', $thisMonthStart)->sum('amount');
            return [
                'id'                  => $center->id,
                'sc_id'               => $center->sc_id,
                'center_name'         => $center->center_name,
                'branch_type'         => $center->branch_type,
                'status'              => $center->status,
                'partner'             => $center->partner,
                'area_id'             => $center->area_id,
                'zone_id'             => $center->zone_id,
                'active_staff'        => $center->staff->where('status', 'Active')->count(),
                'monthly_staff_cost'  => round($staffCost, 2),
                'monthly_op_cost'     => round($opCost, 2),
                'total_monthly_cost'  => round($staffCost + $opCost, 2),
                'equipment_units'     => (int) $center->equipment->sum('quantity'),
                'opening_date'        => $center->opening_date,
            ];
        });

        return $this->success(array_merge($summary, ['centers' => $centerList]), 'Global SC dashboard loaded.');
    }
}
