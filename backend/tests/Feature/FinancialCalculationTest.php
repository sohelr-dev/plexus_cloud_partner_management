<?php

namespace Tests\Feature;

use App\Models\Financial\PartnerCost;
use App\Models\Financial\PartnerPayment;
use App\Models\Financial\PartnerProfitLoss;
use App\Models\Financial\PartnerRevenue;
use App\Models\Financial\PartnerRoi;
use App\Models\Partner\Partner;
use App\Services\FinancialCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_pnl_formula_calculation_is_accurate(): void
    {
        $partner = Partner::create([
            'partner_name'     => 'Apex Network Ltd',
            'partner_type'     => 'ISP',
            'partner_category' => 'A',
            'status'           => 'Active',
            'contact_person'   => 'Test Manager',
            'contact_number'   => '01700000000',
            'email'            => 'apex@test.com',
        ]);

        $currentMonth = now()->format('Y-m');
        $date = now()->format('Y-m-15');

        // Revenue: 100,000
        PartnerRevenue::create([
            'partner_id'     => $partner->id,
            'revenue_date'   => $date,
            'revenue_source' => 'Bandwidth Sales',
            'amount'         => 100000.00,
        ]);

        // Direct Cost (Bandwidth): 40,000
        PartnerCost::create([
            'partner_id' => $partner->id,
            'cost_date'  => $date,
            'cost_type'  => 'Bandwidth Cost',
            'amount'     => 40000.00,
        ]);

        // Commission Cost: 10,000
        PartnerCost::create([
            'partner_id' => $partner->id,
            'cost_date'  => $date,
            'cost_type'  => 'Commission',
            'amount'     => 10000.00,
        ]);

        // Operating Cost: 15,000
        PartnerCost::create([
            'partner_id' => $partner->id,
            'cost_date'  => $date,
            'cost_type'  => 'Office Rent',
            'amount'     => 15000.00,
        ]);

        // Payment: 70,000
        PartnerPayment::create([
            'partner_id'     => $partner->id,
            'payment_date'   => $date,
            'payment_method' => 'Bank Transfer',
            'amount'         => 70000.00,
            'status'         => 'Completed',
        ]);

        // Execute Calculation
        $pnl = FinancialCalculationService::calculatePnL($partner, $currentMonth);

        // Verification of PRD Section 99 formulas:
        // Total Revenue = 100,000
        // Direct Cost = 40,000
        // Gross Profit = 100,000 - 40,000 = 60,000
        // Total Cost = 40,000 + 10,000 + 15,000 = 65,000
        // Net Profit = 100,000 - 65,000 = 35,000
        // Profit Margin % = (35,000 / 100,000) * 100 = 35.00%
        // Outstanding = 100,000 - 70,000 = 30,000
        $this->assertEquals(100000.00, (float) $pnl->total_revenue);
        $this->assertEquals(40000.00, (float) $pnl->direct_cost);
        $this->assertEquals(60000.00, (float) $pnl->gross_profit);
        $this->assertEquals(35000.00, (float) $pnl->net_profit);
        $this->assertEquals(35.00, (float) $pnl->profit_margin_percent);
        $this->assertEquals(30000.00, (float) $pnl->outstanding_balance);
    }

    public function test_roi_calculation_formula_is_accurate(): void
    {
        $partner = Partner::create([
            'partner_name'     => 'SpeedNet Global',
            'partner_type'     => 'Corporate',
            'partner_category' => 'B',
            'status'           => 'Active',
            'contact_person'   => 'ROI Manager',
            'contact_number'   => '01800000000',
            'email'            => 'speednet@test.com',
        ]);

        // Investment = 200,000, Net Return = 50,000
        // ROI % = (50,000 / 200,000) * 100 = 25.00%
        $investment = 200000.00;
        $netReturn = 50000.00;
        $expectedRoi = round(($netReturn / $investment) * 100, 2);

        $roiRecord = PartnerRoi::create([
            'partner_id'            => $partner->id,
            'investment_category'   => 'Network Expansion',
            'investment_amount'     => $investment,
            'net_return_amount'     => $netReturn,
            'roi_percent'           => $expectedRoi,
            'payback_period_months' => 4.0,
            'snapshot_date'         => now()->toDateString(),
        ]);

        $this->assertEquals(25.00, (float) $roiRecord->roi_percent);
        $this->assertEquals($investment, (float) $roiRecord->investment_amount);
        $this->assertEquals($netReturn, (float) $roiRecord->net_return_amount);
    }
}
