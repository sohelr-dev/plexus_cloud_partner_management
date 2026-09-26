<?php

namespace App\Jobs;

use App\Services\DocumentManagementService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;


class RefreshDocumentExpiryAlertsJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $result = DocumentManagementService::refreshAllExpiryAlerts();

        Log::info('Document expiry alerts refreshed.', $result);
    }
}
