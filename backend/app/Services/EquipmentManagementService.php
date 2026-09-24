<?php

namespace App\Services;

use App\Models\Equipment\PartnerDeviceHistory;
use App\Models\Equipment\PartnerEndDevice;
use App\Models\Equipment\PartnerEquipment;
use App\Models\Equipment\PartnerEquipmentAssignment;
use App\Models\Equipment\PartnerEquipmentHistory;
use App\Models\Equipment\PartnerEquipmentMaintenance;
use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class EquipmentManagementService
{
    /**
     * Get summary metrics and equipment list for a partner.
     */
    public static function getEquipmentSummary(Partner $partner): array
    {
        $equipments = PartnerEquipment::where('partner_id', $partner->id)->get();
        $endDevices = PartnerEndDevice::where('partner_id', $partner->id)->get();

        $totalUnits     = $equipments->count();
        $activeUnits    = $equipments->whereIn('status', ['Active', 'Installed', 'Assigned'])->count();
        $faultyUnits    = $equipments->whereIn('status', ['Faulty', 'Under Maintenance'])->count();
        
        // Count warranty expiring within 30 days
        $warrantyExpiringCount = $equipments->filter(function ($eq) {
            if (!$eq->warranty_end) return false;
            $diffDays = Carbon::now()->diffInDays(Carbon::parse($eq->warranty_end), false);
            return $diffDays >= 0 && $diffDays <= 30;
        })->count();

        $totalEndDevices = $endDevices->count();
        $activeEndDevices = $endDevices->where('status', 'Active')->count();

        return [
            'total_units'             => $totalUnits,
            'active_units'            => $activeUnits,
            'faulty_units'            => $faultyUnits,
            'warranty_expiring_count' => $warrantyExpiringCount,
            'total_end_devices'       => $totalEndDevices,
            'active_end_devices'      => $activeEndDevices,
            'equipments'              => $equipments,
            'end_devices'             => $endDevices,
        ];
    }

    /**
     * Add and assign equipment asset to partner.
     */
    public static function createEquipment(Partner $partner, array $data, ?User $performedBy = null): PartnerEquipment
    {
        return DB::transaction(function () use ($partner, $data, $performedBy) {
            $equipment = PartnerEquipment::create(array_merge($data, [
                'partner_id' => $partner->id,
                'status'     => $data['status'] ?? 'Assigned',
            ]));

            PartnerEquipmentAssignment::create([
                'equipment_id'  => $equipment->id,
                'partner_id'    => $partner->id,
                'assigned_date' => $equipment->installation_date ?? now()->toDateString(),
                'assigned_by'   => $performedBy ? $performedBy->id : auth()->id(),
                'status'        => 'Active',
                'remarks'       => 'Initially assigned upon asset registration.',
            ]);

            PartnerEquipmentHistory::create([
                'equipment_id' => $equipment->id,
                'event_type'   => 'Assigned',
                'event_date'   => now()->toDateString(),
                'performed_by' => $performedBy ? $performedBy->id : auth()->id(),
                'remarks'      => "Assigned {$equipment->equipment_type} ({$equipment->serial_number}) to partner.",
            ]);

            return $equipment;
        });
    }

    /**
     * Register a new end device (MAC address, ONU, CPE).
     */
    public static function createEndDevice(Partner $partner, array $data, ?User $performedBy = null): PartnerEndDevice
    {
        return DB::transaction(function () use ($partner, $data, $performedBy) {
            $device = PartnerEndDevice::create(array_merge($data, [
                'partner_id'      => $partner->id,
                'status'          => $data['status'] ?? 'Active',
                'activation_date' => $data['activation_date'] ?? now()->toDateString(),
            ]));

            PartnerDeviceHistory::create([
                'device_id'    => $device->id,
                'event_type'   => 'Added',
                'event_date'   => now(),
                'performed_by' => $performedBy ? $performedBy->id : auth()->id(),
                'remarks'      => "Registered end device {$device->device_type} ({$device->identifier}).",
            ]);

            return $device;
        });
    }

    /**
     * Log maintenance for an equipment item.
     */
    public static function logMaintenance(PartnerEquipment $equipment, array $data, ?User $performedBy = null): PartnerEquipmentMaintenance
    {
        return DB::transaction(function () use ($equipment, $data, $performedBy) {
            $maintenance = PartnerEquipmentMaintenance::create([
                'equipment_id'     => $equipment->id,
                'maintenance_date' => $data['maintenance_date'] ?? now()->toDateString(),
                'maintenance_type' => $data['maintenance_type'] ?? 'Corrective',
                'cost'             => $data['cost'] ?? 0,
                'description'      => $data['description'] ?? null,
                'performed_by'     => $performedBy ? $performedBy->name : 'Engineer',
                'next_due_date'    => $data['next_due_date'] ?? null,
                'status'           => $data['status'] ?? 'Completed',
            ]);

            if (isset($data['update_equipment_status'])) {
                $equipment->status = $data['update_equipment_status'];
                $equipment->save();
            }

            PartnerEquipmentHistory::create([
                'equipment_id' => $equipment->id,
                'event_type'   => 'Maintenance',
                'event_date'   => now()->toDateString(),
                'performed_by' => $performedBy ? $performedBy->id : auth()->id(),
                'remarks'      => "Logged maintenance: {$maintenance->maintenance_type} (Cost: ৳{$maintenance->cost}).",
            ]);

            return $maintenance;
        });
    }
}
