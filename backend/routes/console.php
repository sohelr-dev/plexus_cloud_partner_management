<?php

use App\Jobs\RefreshDocumentExpiryAlertsJob;
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
