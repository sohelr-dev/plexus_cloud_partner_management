<?php

namespace App\Jobs;

use App\Models\Partner\Partner;
use App\Services\PartnerHealthService;
use App\Services\PartnerInsightService;
use App\Services\PartnerRiskService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class RecalculateHealthScoresJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public ?Partner $partner = null)
    {
    }

    public function handle(): void
    {
        $partners = $this->partner ? collect([$this->partner]) : Partner::where('status', 'Active')->get();
        $processed = 0;
        $failed    = 0;

        foreach ($partners as $partner) {
            try {
                PartnerHealthService::calculate($partner);
                PartnerRiskService::detect($partner);
                PartnerInsightService::generate($partner);
                $processed++;
            } catch (\Throwable $e) {
                $failed++;
                Log::error("Health recalculation failed for partner #{$partner->id}: " . $e->getMessage());
            }
        }

        Log::info("Health recalculation complete — processed: {$processed}, failed: {$failed}");
    }
}
