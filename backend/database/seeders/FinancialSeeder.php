<?php

namespace Database\Seeders;

use App\Models\Financial\PartnerCost;
use App\Models\Financial\PartnerPayment;
use App\Models\Financial\PartnerRevenue;
use App\Models\Financial\PartnerRoi;
use App\Models\Partner\Partner;
use App\Services\FinancialCalculationService;
use Illuminate\Database\Seeder;

class FinancialSeeder extends Seeder
{
    public function run(): void
    {
        $partners = Partner::take(5)->get();
        if ($partners->isEmpty()) return;

        foreach ($partners as $partner) {

            PartnerRevenue::updateOrCreate(
                ['partner_id' => $partner->id, 'source_reference' => "INV-2026-00{$partner->id}-1"],
                [
                    'revenue_date'   => now()->subDays(15),
                    'revenue_source' => 'Bandwidth Sales',
                    'source_system'  => 'Billing ERP',
                    'amount'         => 85000.00,
                    'description'    => 'Monthly 500 Mbps Bandwidth Purchase',
                ]
            );

            PartnerRevenue::updateOrCreate(
                ['partner_id' => $partner->id, 'source_reference' => "INV-2026-00{$partner->id}-2"],
                [
                    'revenue_date'   => now()->subDays(5),
                    'revenue_source' => 'Internet',
                    'source_system'  => 'Billing ERP',
                    'amount'         => 35000.00,
                    'description'    => 'Direct Corporate Connection Package',
                ]
            );


            PartnerCost::updateOrCreate(
                ['partner_id' => $partner->id, 'source_reference' => "CST-2026-00{$partner->id}-1"],
                [
                    'cost_date'     => now()->subDays(12),
                    'cost_type'     => 'Bandwidth Cost',
                    'source_system' => 'Upstream Billing',
                    'amount'        => 45000.00,
                    'description'   => 'Upstream IIG Cost',
                ]
            );

            PartnerCost::updateOrCreate(
                ['partner_id' => $partner->id, 'source_reference' => "CST-2026-00{$partner->id}-2"],
                [
                    'cost_date'     => now()->subDays(8),
                    'cost_type'     => 'Commission',
                    'source_system' => 'Commission Engine',
                    'amount'        => 12000.00,
                    'description'   => '10% Sales Commission Payout',
                ]
            );

            PartnerPayment::updateOrCreate(
                ['partner_id' => $partner->id, 'reference_number' => "PAY-2026-00{$partner->id}"],
                [
                    'payment_date'   => now()->subDays(3),
                    'payment_method' => 'Bank Transfer',
                    'amount'         => 90000.00,
                    'status'         => 'Completed',
                    'remarks'        => 'Settled Invoice #INV-2026-001',
                ]
            );

            PartnerRoi::updateOrCreate(
                ['partner_id' => $partner->id, 'investment_category' => 'Security Deposit'],
                [
                    'investment_amount'     => 100000.00,
                    'net_return_amount'     => 28000.00,
                    'roi_percent'           => 28.00,
                    'payback_period_months' => 12.00,
                    'snapshot_date'         => now(),
                    'remarks'               => 'Security Deposit ROI evaluation',
                ]
            );

            // Calculate P&L Snapshot
            FinancialCalculationService::calculatePnL($partner);
        }

        $this->command->info('✅ Financial data (Revenues, Costs, Payments, ROI, P&L) seeded successfully.');
    }
}
