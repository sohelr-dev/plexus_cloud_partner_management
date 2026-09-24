<?php

namespace Database\Seeders;

use App\Models\Equipment\PartnerEndDevice;
use App\Models\Equipment\PartnerEquipment;
use App\Models\Equipment\PartnerEquipmentAssignment;
use App\Models\Equipment\PartnerEquipmentHistory;
use App\Models\Equipment\PartnerEquipmentMaintenance;
use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        $partner = Partner::first();
        if (!$partner) return;

        $user = User::first();

        // 1. Seed Equipment Assets
        $eq1 = PartnerEquipment::create([
            'equipment_id'      => 'EQ-20260601-ROUT',
            'asset_id'          => 'AST-10024',
            'serial_number'     => 'SN-MT-CCR1036-99',
            'mac_address'       => '64:D1:54:88:99:AA',
            'equipment_type'    => 'Router',
            'manufacturer'      => 'MikroTik',
            'model'             => 'CCR1036-12G-4S',
            'vendor'            => 'Plexus Hardware',
            'purchase_date'     => now()->subMonths(6)->toDateString(),
            'purchase_cost'     => 120000.00,
            'installation_date' => now()->subMonths(5)->toDateString(),
            'location'          => 'Main POP Rack A-12',
            'partner_id'        => $partner->id,
            'ownership'         => 'Company Owned',
            'warranty_start'    => now()->subMonths(6)->toDateString(),
            'warranty_end'      => now()->addDays(20)->toDateString(), // Expedited warning < 30 days
            'status'            => 'Active',
        ]);

        $eq2 = PartnerEquipment::create([
            'equipment_id'      => 'EQ-20260701-OLT1',
            'asset_id'          => 'AST-10088',
            'serial_number'     => 'SN-HW-MA5608-01',
            'mac_address'       => '70:7B:E8:11:22:33',
            'equipment_type'    => 'OLT',
            'manufacturer'      => 'Huawei',
            'model'             => 'SmartAX MA5608T',
            'vendor'            => 'Fiber World',
            'purchase_date'     => now()->subMonths(4)->toDateString(),
            'purchase_cost'     => 250000.00,
            'installation_date' => now()->subMonths(3)->toDateString(),
            'location'          => 'Branch POP Rack B-04',
            'partner_id'        => $partner->id,
            'ownership'         => 'Partner Owned',
            'warranty_start'    => now()->subMonths(4)->toDateString(),
            'warranty_end'      => now()->addYear()->toDateString(),
            'status'            => 'Active',
        ]);

        // Assignments & History
        PartnerEquipmentAssignment::create([
            'equipment_id'  => $eq1->id,
            'partner_id'    => $partner->id,
            'assigned_date' => now()->subMonths(5)->toDateString(),
            'assigned_by'   => $user ? $user->id : null,
            'status'        => 'Active',
            'remarks'       => 'Installed on core POP router slot.',
        ]);

        PartnerEquipmentHistory::create([
            'equipment_id' => $eq1->id,
            'event_type'   => 'Assigned',
            'event_date'   => now()->subMonths(5)->toDateString(),
            'performed_by' => $user ? $user->id : null,
            'remarks'      => 'Assigned MikroTik CCR1036 to partner.',
        ]);

        // 2. Seed End Devices
        PartnerEndDevice::create([
            'partner_id'      => $partner->id,
            'device_type'     => 'ONU',
            'identifier'      => 'HWTC12345678',
            'status'          => 'Active',
            'activation_date' => now()->subMonths(2)->toDateString(),
        ]);

        PartnerEndDevice::create([
            'partner_id'      => $partner->id,
            'device_type'     => 'MAC Address',
            'identifier'      => '00:1A:2B:3C:4D:5E',
            'status'          => 'Active',
            'activation_date' => now()->subMonth()->toDateString(),
        ]);
    }
}
