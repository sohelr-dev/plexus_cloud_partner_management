<?php

namespace Database\Seeders;

use App\Models\Bandwidth\PartnerBandwidthAllocation;
use App\Models\Bandwidth\PartnerBandwidthApproval;
use App\Models\Bandwidth\PartnerBandwidthChange;
use App\Models\Bandwidth\PartnerBandwidthHistory;
use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Seeder;

class BandwidthSeeder extends Seeder
{
    public function run(): void
    {
        $partner = Partner::first();
        if (!$partner) return;

        $user = User::first();

        // 1. Seed Allocations
        $alloc1 = PartnerBandwidthAllocation::create([
            'partner_id'          => $partner->id,
            'service'             => 'Internet',
            'allocated_mbps'      => 500.00,
            'used_mbps'           => 380.00,
            'available_mbps'      => 120.00,
            'utilization_percent' => 76.00,
            'ratio'               => '1:1',
            'price'               => 150000.00,
            'cost'                => 105000.00,
            'effective_date'      => now()->subMonths(3)->toDateString(),
            'status'              => 'Active',
            'work_order_id'       => 'WO-20260601-INT1',
        ]);

        $alloc2 = PartnerBandwidthAllocation::create([
            'partner_id'          => $partner->id,
            'service'             => 'BDIX',
            'allocated_mbps'      => 1000.00,
            'used_mbps'           => 750.00,
            'available_mbps'      => 250.00,
            'utilization_percent' => 75.00,
            'ratio'               => '1:4',
            'price'               => 80000.00,
            'cost'                => 45000.00,
            'effective_date'      => now()->subMonths(2)->toDateString(),
            'status'              => 'Active',
            'work_order_id'       => 'WO-20260701-BD1',
        ]);

        // 2. Seed a Change Request (Upgrade Request Pending)
        $change = PartnerBandwidthChange::create([
            'partner_id'          => $partner->id,
            'allocation_id'       => $alloc1->id,
            'change_type'         => 'Upgrade',
            'previous_mbps'       => 500.00,
            'new_mbps'            => 800.00,
            'difference_mbps'     => 300.00,
            'revenue_impact'      => 90000.00,
            'cost_impact'         => 63000.00,
            'profit_impact'       => 27000.00,
            'reason'              => 'Client expanding retail ISP operations in Zone A.',
            'effective_date'      => now()->addDays(2)->toDateString(),
            'requester_id'        => $user ? $user->id : null,
            'status'              => 'Requested',
        ]);

        PartnerBandwidthApproval::create([
            'change_id'      => $change->id,
            'approval_level' => 1,
            'status'         => 'Pending',
        ]);

        PartnerBandwidthHistory::create([
            'partner_id'     => $partner->id,
            'allocation_id'  => $alloc1->id,
            'change_id'      => $change->id,
            'event_type'     => 'Upgrade Requested',
            'previous_value' => 500.00,
            'new_value'      => 800.00,
            'changed_by'     => $user ? $user->id : null,
            'changed_at'     => now(),
            'remarks'        => 'Requested Upgrade from 500 Mbps to 800 Mbps.',
        ]);
    }
}
