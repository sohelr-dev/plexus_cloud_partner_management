<?php

namespace App\Services;

use App\Models\Partner\Partner;
use App\Models\SupportCenter\PartnerSupportCenter;
use App\Models\SupportCenter\PartnerSupportCenterCost;
use App\Models\SupportCenter\PartnerSupportCenterEquipment;
use App\Models\SupportCenter\PartnerSupportCenterHistory;
use App\Models\SupportCenter\PartnerSupportCenterService;
use App\Models\SupportCenter\PartnerSupportCenterStaff;
use App\Models\Financial\PartnerCost;
use App\Models\Financial\PartnerRevenue;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Support Center Management Service.
 */
class SupportCenterManagementService
{
    public static function getSummary(Partner $partner): array
    {
        $centers = PartnerSupportCenter::with(['staff', 'services', 'costs', 'equipment'])
            ->where('partner_id', $partner->id)
            ->orderBy('center_name')
            ->get();

        $totals = [
            'total_centers'        => $centers->count(),
            'active_centers'       => $centers->where('status', 'Active')->count(),
            'planned_centers'      => $centers->where('status', 'Planned')->count(),
            'closed_centers'       => $centers->whereIn('status', ['Closed', 'Suspended'])->count(),
            'total_staff'          => 0,
            'active_staff'         => 0,
            'vacant_positions'     => 0,
            'monthly_staff_cost'   => 0.0,
            'monthly_operating_cost' => 0.0,
            'total_equipment_units'  => 0,
        ];

        foreach ($centers as $center) {
            $totals['total_staff']        += $center->staff->where('status', '!=', 'Resigned')->where('status', '!=', 'Terminated')->count();
            $totals['active_staff']       += $center->staff->where('status', 'Active')->count();
            $totals['vacant_positions']   += $center->staff->where('status', 'Vacant')->count();
            $totals['monthly_staff_cost'] += (float) $center->staff->where('status', 'Active')->sum('monthly_cost');
            $totals['monthly_operating_cost'] += (float) $center->costs
                ->where('cost_date', '>=', now()->startOfMonth()->toDateString())
                ->sum('amount');
            $totals['total_equipment_units'] += (int) $center->equipment->sum('quantity');
        }

        foreach ($centers as $center) {
            $thisMonthStart = now()->startOfMonth()->toDateString();
            $operatingCost  = (float) $center->costs->where('cost_date', '>=', $thisMonthStart)->sum('amount');
            $staffCost      = (float) $center->staff->where('status', 'Active')->sum('monthly_cost');
            $equipmentCost  = (float) $center->equipment->sum(function ($e) {
                return $e->equipment?->purchase_cost ?? 0; // when linked to central inventory
            });
            $activeCenters = max(1, $centers->where('status', 'Active')->count());
            $monthlyRevenue = (float) PartnerRevenue::where('partner_id', $partner->id)
                ->where('revenue_date', '>=', $thisMonthStart)
                ->sum('amount');
            $revenueContribution = $center->status === 'Active' ? $monthlyRevenue / $activeCenters : 0;

            $center->performance = [
                'monthly_operating_cost'   => round($operatingCost, 2),
                'monthly_staff_cost'       => round($staffCost, 2),
                'equipment_cost'           => round($equipmentCost, 2),
                'revenue_contribution'     => round($revenueContribution, 2),
                'profit_contribution'      => round($revenueContribution - $operatingCost - $staffCost - $equipmentCost, 2),
                'customers_served'         => $center->services->sum('customer_capacity'),
            ];
        }

        return array_merge($totals, ['centers' => $centers]);
    }

    public static function createCenter(Partner $partner, array $data, ?User $performedBy = null): PartnerSupportCenter
    {
        return DB::transaction(function () use ($partner, $data, $performedBy) {
            $center = PartnerSupportCenter::create(array_merge($data, [
                'partner_id' => $partner->id,
                'staff_count' => $data['staff_count'] ?? 0,
            ]));

            self::logHistory($center, 'Created', "Support Center '{$center->center_name}' created.", $performedBy);

            if ($center->status === 'Active') {
                $openedOn = $center->opening_date?->toDateString() ?? now()->toDateString();
                self::logHistory($center, 'Opened', "Branch opened ({$openedOn}).", $performedBy);
            }

            AuditLogService::log(
                'support_center.created',
                $center,
                null,
                $center->toArray(),
                "Created Support Center {$center->sc_id} for partner #{$partner->id}."
            );

            return $center->fresh();
        });
    }

    public static function updateCenter(PartnerSupportCenter $center, array $data, ?User $performedBy = null): PartnerSupportCenter
    {
        return DB::transaction(function () use ($center, $data, $performedBy) {
            $old = $center->getOriginal();

            $center->update($data);

            foreach (['branch_manager_id' => 'Manager Changed', 'address' => 'Location Changed', 'service_coverage' => 'Coverage Changed'] as $field => $event) {
                if (array_key_exists($field, $data) && ($old[$field] ?? null) != ($center->{$field})) {
                    self::logHistory($center, $event, ucfirst(str_replace('_', ' ', $field)) . ' updated.', $performedBy);
                }
            }

            if (($old['status'] ?? null) !== $center->status) {
                self::logHistory(
                    $center,
                    $center->status === 'Closed' ? 'Closed' : ($center->status === 'Suspended' ? 'Suspended' : 'Status Changed'),
                    "Status changed {$old['status']} → {$center->status}.",
                    $performedBy
                );
            }

            AuditLogService::log(
                'support_center.updated',
                $center,
                $old,
                $center->toArray(),
                "Updated Support Center {$center->sc_id}."
            );

            return $center->fresh();
        });
    }

    public static function changeStatus(PartnerSupportCenter $center, string $status, ?string $reason, ?User $performedBy = null): PartnerSupportCenter
    {
        $old = $center->status;
        $center->update(['status' => $status]);

        self::logHistory(
            $center,
            $status === 'Suspended' ? 'Suspended' : ($status === 'Closed' ? 'Closed' : 'Status Changed'),
            "Status: {$old} → {$status}. Reason: " . ($reason ?? 'N/A'),
            $performedBy
        );

        AuditLogService::log(
            'support_center.status_changed',
            $center,
            ['status' => $old],
            ['status' => $status],
            "Support Center {$center->sc_id} status changed to {$status}."
        );

        return $center->fresh();
    }

    public static function addStaff(PartnerSupportCenter $center, array $data, ?User $performedBy = null): PartnerSupportCenterStaff
    {
        return DB::transaction(function () use ($center, $data, $performedBy) {
            $staff = PartnerSupportCenterStaff::create(array_merge($data, [
                'support_center_id' => $center->id,
            ]));

            $center->update(['staff_count' => $center->staff()->where('status', 'Active')->count()]);
            self::logHistory($center, 'Staff Changed', "Staff added: {$staff->staff_category}" . ($staff->staff_name ? " ({$staff->staff_name})" : '') . '.', $performedBy);

            return $staff;
        });
    }

    public static function addCost(PartnerSupportCenter $center, array $data, ?User $performedBy = null): PartnerSupportCenterCost
    {
        $cost = PartnerSupportCenterCost::create(array_merge($data, [
            'support_center_id' => $center->id,
        ]));

        self::logHistory($center, 'Cost Changed', "Operating cost recorded: {$cost->cost_type} ৳{$cost->amount}.", $performedBy);

        PartnerCost::create([
            'partner_id'       => $center->partner_id,
            'cost_date'        => $cost->cost_date,
            'cost_type'        => 'Support Center Cost',
            'amount'           => $cost->amount,
            'description'      => "SC {$center->sc_id} ({$center->center_name}): {$cost->cost_type}" . ($cost->description ? " — {$cost->description}" : ''),
            'source_reference' => 'SC-COST-' . $cost->id,
            'source_system'    => 'support_center_module',
        ]);

        return $cost;
    }

    public static function addEquipment(PartnerSupportCenter $center, array $data, ?User $performedBy = null): PartnerSupportCenterEquipment
    {
        $eq = PartnerSupportCenterEquipment::create(array_merge($data, [
            'support_center_id' => $center->id,
        ]));

        self::logHistory($center, 'Equipment Added', "Equipment added: {$eq->equipment_type} ×{$eq->quantity}.", $performedBy);

        return $eq;
    }

    public static function updateStaff(PartnerSupportCenterStaff $staff, array $data, ?User $performedBy = null): PartnerSupportCenterStaff
    {
        return DB::transaction(function () use ($staff, $data, $performedBy) {
            $old = $staff->status;
            $staff->update($data);

            $center = $staff->center;
            $center->update(['staff_count' => $center->staff()->where('status', 'Active')->count()]);
            self::logHistory($center, 'Staff Changed', "Staff updated: {$staff->staff_category}" . ($staff->staff_name ? " ({$staff->staff_name})" : '') . '.', $performedBy);

            if ($old !== $staff->status) {
                self::logHistory($center, 'Staff Status Changed', "Staff {$staff->staff_category} status changed {$old} → {$staff->status}.", $performedBy);
            }

            return $staff->fresh();
        });
    }

    public static function deleteStaff(PartnerSupportCenterStaff $staff, ?User $performedBy = null): void
    {
        DB::transaction(function () use ($staff, $performedBy) {
            $center = $staff->center;
            $label = $staff->staff_category . ($staff->staff_name ? " ({$staff->staff_name})" : '');

            $staff->delete();

            $center->update(['staff_count' => $center->staff()->where('status', 'Active')->count()]);
            self::logHistory($center, 'Staff Changed', "Staff removed: {$label}.", $performedBy);
        });
    }

    public static function updateService(PartnerSupportCenterService $service, array $data, ?User $performedBy = null): PartnerSupportCenterService
    {
        $service->update($data);
        self::logHistory($service->center, 'Service Updated', "Service updated: {$service->service_name}.", $performedBy);

        return $service->fresh();
    }

    public static function deleteService(PartnerSupportCenterService $service, ?User $performedBy = null): void
    {
        $center = $service->center;
        $name = $service->service_name;

        $service->delete();
        self::logHistory($center, 'Service Removed', "Service removed: {$name}.", $performedBy);
    }

    public static function updateEquipment(PartnerSupportCenterEquipment $equipment, array $data, ?User $performedBy = null): PartnerSupportCenterEquipment
    {
        $equipment->update($data);
        self::logHistory($equipment->center, 'Equipment Updated', "Equipment updated: {$equipment->equipment_type} ×{$equipment->quantity}.", $performedBy);

        return $equipment->fresh();
    }

    public static function deleteEquipment(PartnerSupportCenterEquipment $equipment, ?User $performedBy = null): void
    {
        $center = $equipment->center;
        $label = "{$equipment->equipment_type} ×{$equipment->quantity}";

        $equipment->delete();
        self::logHistory($center, 'Equipment Removed', "Equipment removed: {$label}.", $performedBy);
    }

    public static function deleteCost(PartnerSupportCenterCost $cost, ?User $performedBy = null): void
    {
        $center = $cost->center;
        $label = "{$cost->cost_type} ৳{$cost->amount}";

        $cost->delete();

        // Mirror the deletion to the PartnerCost ledger entry created at creation time.
        PartnerCost::where('source_reference', 'SC-COST-' . $cost->id)
            ->where('source_system', 'support_center_module')
            ->delete();

        self::logHistory($center, 'Cost Changed', "Operating cost removed: {$label}.", $performedBy);
    }

    public static function logHistory(PartnerSupportCenter $center, string $eventType, string $remarks, ?User $performedBy = null): void
    {
        PartnerSupportCenterHistory::create([
            'support_center_id' => $center->id,
            'event_type'        => $eventType,
            'remarks'           => $remarks,
            'performed_by'      => $performedBy?->id ?? auth()->id(),
            'event_date'        => now(),
        ]);
    }
}
