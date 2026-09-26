<?php

use App\Jobs\RefreshDocumentExpiryAlertsJob;
use App\Jobs\RecalculateHealthScoresJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


Artisan::command('documents:refresh-expiry', function () {
    $result = \App\Services\DocumentManagementService::refreshAllExpiryAlerts();

    $this->info(sprintf(
        'Expiry refresh complete — documents: %d, alerts: %d, marked expired: %d',
        $result['documents_processed'],
        $result['alerts_synced'],
        $result['marked_expired'],
    ));
})->purpose('Rebuild document expiry alerts (90/60/30/15/7 days) and flag expired documents.');

Schedule::job(new RefreshDocumentExpiryAlertsJob())
    ->dailyAt('01:00')
    ->name('document-expiry-refresh')
    ->withoutOverlapping();

Schedule::job(new RecalculateHealthScoresJob())
    ->dailyAt('02:00')
    ->name('health-score-recalculate')
    ->withoutOverlapping();

Artisan::command('health:recalculate {--partner=}', function () {
    $partnerId = $this->option('partner');
    if ($partnerId) {
        $partner = \App\Models\Partner\Partner::findOrFail($partnerId);
        \App\Services\PartnerHealthService::calculate($partner);
        \App\Services\PartnerRiskService::detect($partner);
        \App\Services\PartnerInsightService::generate($partner);
        $this->info("Health recalculated for partner #{$partnerId}.");
    } else {
        dispatch(new RecalculateHealthScoresJob());
        $this->info('Health recalculation job dispatched for all active partners.');
    }
})->purpose('Recalculate partner health scores, risks, and insights.');
