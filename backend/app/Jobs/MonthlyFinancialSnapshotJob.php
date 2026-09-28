<?php

namespace App\Jobs;

use App\Models\Financial\PartnerFinancialSnapshot;
use App\Models\Financial\PartnerPayment;
use App\Models\Financial\PartnerRevenue;
use App\Models\Partner\Partner;
use App\Services\FinancialCalculationService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;


class MonthlyFinancialSnapshotJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Log::info('MonthlyFinancialSnapshotJob started.');

        $previousMonth = Carbon::now()->subMonth();
        $periodKey     = $previousMonth->format('Y-m');
        $snapshotDate  = $previousMonth->endOfMonth()->toDateString();

        $partners = Partner::where('status', 'Active')->get();
        $count = 0;

        foreach ($partners as $partner) {
            try {
                $pnl = FinancialCalculationService::calculatePnL($partner, $periodKey);

                $totalInvoiced = (float) PartnerRevenue::where('partner_id', $partner->id)->sum('amount');
                $totalPaid     = (float) PartnerPayment::where('partner_id', $partner->id)->where('status', 'Completed')->sum('amount');
                $outstanding   = max(0, $totalInvoiced - $totalPaid);

                $overdue = (float) PartnerRevenue::where('partner_id', $partner->id)
                    ->where('revenue_date', '<', Carbon::now()->subDays(30))
                    ->sum('amount');
                $overdue = min($outstanding, $overdue);

                $creditLimit = (float) ($partner->profile->credit_limit ?? 0);
                $creditUtilization = $creditLimit > 0 ? round(($outstanding / $creditLimit) * 100, 2) : 0;

                $lastPayment = PartnerPayment::where('partner_id', $partner->id)
                    ->where('status', 'Completed')
                    ->latest('payment_date')
                    ->first();

                PartnerFinancialSnapshot::updateOrCreate(
                    [
                        'partner_id'    => $partner->id,
                        'snapshot_date' => $snapshotDate,
                    ],
                    [
                        'total_invoiced'     => $totalInvoiced,
                        'total_paid'         => $totalPaid,
                        'outstanding'        => $outstanding,
                        'overdue'            => $overdue,
                        'credit_limit'       => $creditLimit,
                        'credit_utilization' => $creditUtilization,
                        'last_payment_date'  => $lastPayment?->payment_date,
                        'next_due_date'      => Carbon::now()->addDays(15)->toDateString(),
                        'avg_payment_delay'  => 0,
                    ]
                );

                $count++;
            } catch (\Throwable $e) {
                Log::error("Failed monthly snapshot for partner #{$partner->id}: {$e->getMessage()}");
            }
        }

        Log::info("MonthlyFinancialSnapshotJob completed. Processed {$count} partners for period {$periodKey}.");
    }
}
