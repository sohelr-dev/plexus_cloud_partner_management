<?php

namespace App\Http\Controllers\Api\V1\Equipment;

use App\Http\Controllers\Controller;
use App\Models\Equipment\PartnerEndDevice;
use App\Models\Equipment\PartnerEquipment;
use App\Models\Partner\Partner;
use App\Services\AuditLogService;
use App\Services\EquipmentManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    /**
     * Get summary metrics and list of equipment & end devices for a partner.
     */
    public function summary(Partner $partner): JsonResponse
    {
        $summary = EquipmentManagementService::getEquipmentSummary($partner);

        return response()->json([
            'success' => true,
            'data'    => $summary,
        ]);
    }

    /**
     * Add new equipment asset for a partner.
     */
    public function storeEquipment(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'equipment_type' => 'required|string|in:Router,ONU,ONT,OLT,Switch,CPE,Access Point,Other',
            'serial_number'  => 'nullable|string|max:100',
            'mac_address'    => 'nullable|string|max:50',
            'manufacturer'   => 'nullable|string|max:100',
            'model'          => 'nullable|string|max:100',
            'purchase_cost'  => 'nullable|numeric|min:0',
            'ownership'      => 'required|string|in:Company Owned,Partner Owned,Customer Owned,Leased,Rented',
            'warranty_end'   => 'nullable|date',
            'status'         => 'nullable|string|in:Available,Assigned,Installed,Active,Faulty,Under Maintenance,Replaced,Returned,Lost,Retired',
        ]);

        $equipment = EquipmentManagementService::createEquipment($partner, $validated, $request->user());

        AuditLogService::log(
            'equipment.created',
            $partner,
            null,
            $equipment->toArray(),
            "Added equipment asset {$equipment->equipment_id} ({$equipment->equipment_type})."
        );

        return response()->json([
            'success' => true,
            'message' => 'Equipment asset added successfully.',
            'data'    => $equipment,
        ], 201);
    }

    /**
     * Register a new end device for a partner.
     */
    public function storeEndDevice(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'device_type'     => 'required|string|in:MAC Address,Router,ONU,ONT,CPE,Device ID,Serial Number,Other',
            'identifier'      => 'required|string|max:255',
            'customer_id'      => 'nullable|integer',
            'package_id'       => 'nullable|integer',
            'status'          => 'nullable|string|in:Active,Offline,Faulty,Replaced,Suspended,Retired',
            'activation_date' => 'nullable|date',
        ]);

        $device = EquipmentManagementService::createEndDevice($partner, $validated, $request->user());

        AuditLogService::log(
            'end_device.created',
            $partner,
            null,
            $device->toArray(),
            "Registered end device {$device->device_type} ({$device->identifier})."
        );

        return response()->json([
            'success' => true,
            'message' => 'End device registered successfully.',
            'data'    => $device,
        ], 201);
    }

    /**
     * Log maintenance entry for an equipment item.
     */
    public function logMaintenance(Request $request, PartnerEquipment $equipment): JsonResponse
    {
        $validated = $request->validate([
            'maintenance_type'          => 'required|string|in:Preventive,Corrective,Emergency',
            'cost'                      => 'nullable|numeric|min:0',
            'description'               => 'nullable|string|max:1000',
            'next_due_date'             => 'nullable|date',
            'update_equipment_status'   => 'nullable|string|in:Active,Faulty,Under Maintenance,Replaced,Retired',
        ]);

        $maintenance = EquipmentManagementService::logMaintenance($equipment, $validated, $request->user());

        AuditLogService::log(
            'equipment.maintenance',
            $equipment->partner,
            null,
            $maintenance->toArray(),
            "Logged maintenance for equipment #{$equipment->equipment_id}."
        );

        return response()->json([
            'success' => true,
            'message' => 'Equipment maintenance logged successfully.',
            'data'    => $maintenance,
        ]);
    }
    /**
     * Replace an equipment asset.
     */
    public function replace(Request $request, PartnerEquipment $equipment): JsonResponse
    {
        $validated = $request->validate([
            'reason'               => 'nullable|string|max:500',
            'new_equipment_serial' => 'nullable|string|max:100',
            'new_equipment_mac'    => 'nullable|string|max:50',
            'new_purchase_cost'    => 'nullable|numeric|min:0',
        ]);

        $newEquipment = EquipmentManagementService::replaceEquipment($equipment, $validated, $request->user());

        AuditLogService::log(
            'equipment.replaced',
            $equipment->partner,
            $equipment->toArray(),
            $newEquipment->toArray(),
            "Replaced equipment #{$equipment->equipment_id}."
        );

        return response()->json([
            'success' => true,
            'message' => 'Equipment replaced successfully.',
            'data'    => $newEquipment,
        ]);
    }

    /**
     * Return an equipment asset.
     */
    public function returnEquipment(Request $request, PartnerEquipment $equipment): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $returnedEquipment = EquipmentManagementService::returnEquipment($equipment, $validated, $request->user());

        AuditLogService::log(
            'equipment.returned',
            $equipment->partner,
            null,
            $returnedEquipment->toArray(),
            "Returned equipment #{$equipment->equipment_id}."
        );

        return response()->json([
            'success' => true,
            'message' => 'Equipment returned successfully.',
            'data'    => $returnedEquipment,
        ]);
    }
}
