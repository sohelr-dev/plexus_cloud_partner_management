<?php

namespace Tests\Feature;

use App\Models\Commission\CommissionPayment;
use App\Models\Commission\CommissionRule;
use App\Models\Commission\PartnerCommission;
use App\Models\Partner\Partner;
use App\Models\User;
use App\Services\CommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Partner $partner;
    private User $approver;

    protected function setUp(): void
    {
        parent::setUp();

        $this->partner = Partner::create([
            'partner_name'     => 'Delta Broadband',
            'partner_type'     => 'ISP',
            'partner_category' => 'A',
            'status'           => 'Active',
            'contact_person'   => 'Delta Lead',
            'contact_number'   => '01711111111',
            'email'            => 'delta@test.com',
        ]);

        $this->approver = User::create([
            'name'     => 'Finance Manager',
            'email'    => 'approver@test.com',
            'password' => bcrypt('password'),
            'status'   => 'Active',
        ]);
    }

    /**
     *  Commission CANNOT be paid before approval.
     */
    public function test_commission_cannot_be_paid_before_approval_br_09(): void
    {
        $commission = PartnerCommission::create([
            'partner_id'        => $this->partner->id,
            'source_reference'  => 'INV-1001',
            'source_amount'     => 50000.00,
            'commission_amount' => 5000.00,
            'period_month'      => now()->month,
            'period_year'       => now()->year,
            'status'            => 'Generated',
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Cannot pay commission in status [Generated]. Must be Payable (approved first — BR-09).');

        CommissionService::pay($commission, [
            'amount'         => 5000.00,
            'payment_method' => 'Bank Transfer',
        ], $this->approver);
    }

    /**
     * Test full approval and payment lifecycle.
     */
    public function test_commission_approval_advances_to_payable_and_enables_payment(): void
    {
        $commission = PartnerCommission::create([
            'partner_id'        => $this->partner->id,
            'source_reference'  => 'INV-2002',
            'source_amount'     => 80000.00,
            'commission_amount' => 8000.00,
            'period_month'      => now()->month,
            'period_year'       => now()->year,
            'status'            => 'Generated',
        ]);

        // 1. Approve commission
        $approvedCommission = CommissionService::approve($commission, $this->approver, 'Approved for payment');
        $this->assertEquals('Payable', $approvedCommission->status);

        // 2. Pay commission
        $payment = CommissionService::pay($approvedCommission, [
            'amount'           => 8000.00,
            'payment_method'   => 'Bank Transfer',
            'reference_number' => 'TXN-998877',
        ], $this->approver);

        $this->assertInstanceOf(CommissionPayment::class, $payment);
        $this->assertEquals(8000.00, (float) $payment->amount);
        $this->assertEquals('Paid', $approvedCommission->fresh()->status);
    }

    /**
     * Test rejection workflow.
     */
    public function test_commission_rejection_marks_status_rejected(): void
    {
        $commission = PartnerCommission::create([
            'partner_id'        => $this->partner->id,
            'source_reference'  => 'INV-3003',
            'source_amount'     => 10000.00,
            'commission_amount' => 1000.00,
            'period_month'      => now()->month,
            'period_year'       => now()->year,
            'status'            => 'Generated',
        ]);

        $rejected = CommissionService::reject($commission, 'Discrepancy in revenue invoices');
        $this->assertEquals('Rejected', $rejected->status);
    }
}
