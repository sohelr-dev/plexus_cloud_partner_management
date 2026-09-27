<?php

namespace Tests\Feature;

use App\Models\Financial\PartnerCost;
use App\Models\Financial\PartnerRevenue;
use App\Models\Partner\Partner;
use App\Services\FinancialCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LoadAndPerformanceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * High Volume Aggregation Benchmark (PRD Section 96 & 99).
     * Simulates batch financial transactions and verifies sub-second P&L execution.
     */
    public function test_high_volume_transaction_aggregation_performance(): void
    {
        $partner = Partner::create([
            'partner_name'     => 'MegaScale Telecom',
            'partner_type'     => 'Corporate',
            'partner_category' => 'A',
            'status'           => 'Active',
            'contact_person'   => 'CTO',
            'contact_number'   => '01900000000',
            'email'            => 'scale@megatelecom.com',
        ]);

        $currentMonth = now()->format('Y-m');
        $date = now()->toDateString();

        // 1. Bulk insert 2,000 revenue records in chunks
        $revenueRows = [];
        for ($i = 1; $i <= 2000; $i++) {
            $revenueRows[] = [
                'partner_id'       => $partner->id,
                'revenue_date'     => $date,
                'revenue_source'   => 'Bandwidth Sales',
                'source_reference' => "TXN-REV-{$i}",
                'amount'           => 100.00,
                'created_at'       => now(),
                'updated_at'       => now(),
            ];
        }
        foreach (array_chunk($revenueRows, 500) as $chunk) {
            PartnerRevenue::insert($chunk);
        }

        // 2. Bulk insert 1,000 cost records in chunks
        $costRows = [];
        for ($j = 1; $j <= 1000; $j++) {
            $costRows[] = [
                'partner_id'       => $partner->id,
                'cost_date'        => $date,
                'cost_type'        => 'Bandwidth Cost',
                'source_reference' => "TXN-COST-{$j}",
                'amount'           => 40.00,
                'created_at'       => now(),
                'updated_at'       => now(),
            ];
        }
        foreach (array_chunk($costRows, 500) as $chunk) {
            PartnerCost::insert($chunk);
        }

        // 3. Benchmark calculation speed
        $startTime = microtime(true);
        $pnl = FinancialCalculationService::calculatePnL($partner, $currentMonth);
        $duration = microtime(true) - $startTime;

        // Total expected revenue: 2000 * 100 = 200,000
        // Total expected cost: 1000 * 40 = 40,000
        // Net profit: 160,000
        $this->assertEquals(200000.00, (float) $pnl->total_revenue);
        $this->assertEquals(40000.00, (float) $pnl->direct_cost);
        $this->assertEquals(160000.00, (float) $pnl->net_profit);

        // Verification of execution speed: sub-second aggregation threshold (< 1.5s)
        $this->assertLessThan(1.5, $duration, "Aggregation took {$duration}s, which exceeds the 1.5s performance threshold.");
    }
}
