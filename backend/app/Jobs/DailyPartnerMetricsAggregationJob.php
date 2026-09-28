<?php

namespace App\Jobs;

use App\Models\Partner\Partner;
use App\Services\PartnerHealthService;
use App\Services\PartnerInsightService;
use App\Services\PartnerRiskService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;


class DailyPartnerMetricsAggregationJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Log::info('DailyPartnerMetricsAggregationJob started.');

        $partners = Partner::where('status', 'Active')->get();
        $processed = 0;

        foreach ($partners as $partner) {
            try {
                PartnerHealthService::calculate($partner);

                PartnerRiskService::detect($partner);

                PartnerInsightService::generate($partner);

                $processed++;
            } catch (\Throwable $e) {
                Log::error("Failed daily aggregation for partner #{$partner->id}: {$e->getMessage()}");
            }
        }

        Log::info("DailyPartnerMetricsAggregationJob finished. Processed {$processed} active partners.");
    }
}
