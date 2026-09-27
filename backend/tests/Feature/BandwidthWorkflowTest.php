<?php

namespace Tests\Feature;

use App\Models\Bandwidth\PartnerBandwidthAllocation;
use App\Models\Bandwidth\PartnerBandwidthChange;
use App\Models\Partner\Partner;
use App\Models\User;
use App\Services\BandwidthManagementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class BandwidthWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Partner $partner;
    private User $networkEngineer;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake(); // Prevent async queue delays during unit execution

        $this->partner = Partner::create([
            'partner_name'     => 'Gigabit Solutions',
            'partner_type'     => 'ISP',
            'partner_category' => 'A',
            'status'           => 'Active',
            'contact_person'   => 'Network Head',
            'contact_number'   => '01722222222',
            'email'            => 'gigabit@test.com',
        ]);

        $this->networkEngineer = User::create([
            'name'     => 'NOC Engineer',
            'email'    => 'noc@test.com',
            'password' => bcrypt('password'),
            'status'   => 'Active',
        ]);
    }

    /**
     * BR-08 Test: Bandwidth change requires approval flow.
     */
    public function test_bandwidth_upgrade_request_and_approval_flow_br_08(): void
    {
        // 1. Initial Allocation: 100 Mbps, 60 Mbps used
        $allocation = PartnerBandwidthAllocation::create([
            'partner_id'          => $this->partner->id,
            'service'             => 'Internet',
            'allocated_mbps'      => 100.0,
            'used_mbps'           => 60.0,
            'available_mbps'      => 40.0,
            'utilization_percent' => 60.0,
            'ratio'               => '1:1',
            'price'               => 50000.0,
            'cost'                => 30000.0,
            'status'              => 'Active',
            'effective_date'      => now()->toDateString(),
        ]);

        // 2. Submit Upgrade Request to 200 Mbps
        $change = BandwidthManagementService::submitChangeRequest($this->partner, [
            'allocation_id'  => $allocation->id,
            'new_mbps'       => 200.0,
            'change_type'    => 'Upgrade',
            'reason'         => 'Client customer expansion',
            'effective_date' => now()->toDateString(),
        ], $this->networkEngineer);

        $this->assertInstanceOf(PartnerBandwidthChange::class, $change);
        $this->assertEquals('Requested', $change->status);
        $this->assertEquals(100.0, (float) $change->previous_mbps);
        $this->assertEquals(200.0, (float) $change->new_mbps);

        // 3. Approve Change Request
        $approvedChange = BandwidthManagementService::approveChange(
            $change,
            $this->networkEngineer,
            'Capacity verified on upstream gateway'
        );

        $this->assertEquals('Completed', $approvedChange->status);
        $this->assertDatabaseHas('partner_bandwidth_approvals', [
            'change_id' => $change->id,
            'status'    => 'Approved',
        ]);

        // 4. Verify allocation is updated
        $freshAllocation = $allocation->fresh();
        $this->assertEquals(200.0, (float) $freshAllocation->allocated_mbps);
        // Used is still 60 Mbps, so utilization on 200 Mbps is (60/200)*100 = 30.0%
        $this->assertEquals(30.0, (float) $freshAllocation->utilization_percent);
        $this->assertEquals(140.0, (float) $freshAllocation->available_mbps);
    }
}
