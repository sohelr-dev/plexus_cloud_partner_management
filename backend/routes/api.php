<?php

use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Commission\CommissionController;
use App\Http\Controllers\Api\V1\Financial\CostController;
use App\Http\Controllers\Api\V1\Financial\FinancialDashboardController;
use App\Http\Controllers\Api\V1\Financial\PaymentController;
use App\Http\Controllers\Api\V1\Financial\RevenueController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\Partner\PartnerController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class)->name('api.health');

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');

    // Protected auth routes (need valid token)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/me',     [AuthController::class, 'me'])->name('auth.me');
    });
});

Route::middleware('auth:sanctum')->group(function () {

    // --- Partners ---
    Route::prefix('partners')->controller(PartnerController::class)->group(function () {
        Route::get('/lookups',              'lookups')->middleware('permission:partner.view')->name('partners.lookups');
        Route::get('/',                    'index')->middleware('permission:partner.view')->name('partners.index');
        Route::post('/',                   'store')->middleware('permission:partner.create')->name('partners.store');
        Route::get('/{partner}',           'show')->middleware('permission:partner.view')->name('partners.show');
        Route::match(['put','patch'], '/{partner}', 'update')->middleware('permission:partner.update')->name('partners.update');
        Route::put('/{partner}/status',    'changeStatus')->middleware('permission:partner.update')->name('partners.status');
        Route::post('/{partner}/approve',   'approve')->middleware('permission:partner.approve')->name('partners.approve');
        Route::delete('/{partner}',        'destroy')->middleware('permission:partner.delete')->name('partners.destroy');
    });

    // --- Financial Module ---
    Route::prefix('financial')->group(function () {
        Route::get('/summary', [FinancialDashboardController::class, 'summary'])
            ->middleware('permission:report.view')
            ->name('financial.summary');

        Route::get('/pnl/{partner}', [FinancialDashboardController::class, 'pnl'])
            ->middleware('permission:revenue.view')
            ->name('financial.pnl');

        Route::get('/roi', [FinancialDashboardController::class, 'roi'])
            ->middleware('permission:report.view')
            ->name('financial.roi');

        // Revenues
        Route::get('/revenues', [RevenueController::class, 'index'])->middleware('permission:revenue.view');
        Route::post('/revenues', [RevenueController::class, 'store'])->middleware('permission:revenue.create');
        Route::delete('/revenues/{revenue}', [RevenueController::class, 'destroy'])->middleware('permission:revenue.create');

        // Costs
        Route::get('/costs', [CostController::class, 'index'])->middleware('permission:cost.view');
        Route::post('/costs', [CostController::class, 'store'])->middleware('permission:cost.create');
        Route::delete('/costs/{cost}', [CostController::class, 'destroy'])->middleware('permission:cost.create');

        // Payments
        Route::get('/payments', [PaymentController::class, 'index'])->middleware('permission:payment.view');
        Route::post('/payments', [PaymentController::class, 'store'])->middleware('permission:payment.create');
        Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])->middleware('permission:payment.create');
    });

    // --- Bandwidth Module (Phase 5.1) ---
    Route::prefix('bandwidth')->group(function () {
        Route::get('/summary/{partner}', [\App\Http\Controllers\Api\V1\Bandwidth\BandwidthController::class, 'summary'])
            ->middleware('permission:partner.view');
        Route::post('/allocations/{partner}', [\App\Http\Controllers\Api\V1\Bandwidth\BandwidthController::class, 'storeAllocation'])
            ->middleware('permission:partner.update');
        Route::post('/change-requests/{partner}', [\App\Http\Controllers\Api\V1\Bandwidth\BandwidthController::class, 'requestChange'])
            ->middleware('permission:partner.update');
        Route::get('/pending-approvals', [\App\Http\Controllers\Api\V1\Bandwidth\BandwidthController::class, 'pendingApprovals'])
            ->middleware('permission:partner.approve');
        Route::post('/changes/{change}/approve', [\App\Http\Controllers\Api\V1\Bandwidth\BandwidthController::class, 'approveChange'])
            ->middleware('permission:partner.approve');
        Route::post('/changes/{change}/reject', [\App\Http\Controllers\Api\V1\Bandwidth\BandwidthController::class, 'rejectChange'])
            ->middleware('permission:partner.approve');
    });

    // --- Equipment & End Devices Module ---
    Route::prefix('equipment')->group(function () {
        Route::get('/summary/{partner}', [\App\Http\Controllers\Api\V1\Equipment\EquipmentController::class, 'summary'])
            ->middleware('permission:partner.view');
        Route::post('/assets/{partner}', [\App\Http\Controllers\Api\V1\Equipment\EquipmentController::class, 'storeEquipment'])
            ->middleware('permission:partner.update');
        Route::post('/end-devices/{partner}', [\App\Http\Controllers\Api\V1\Equipment\EquipmentController::class, 'storeEndDevice'])
            ->middleware('permission:partner.update');
        Route::post('/maintenance/{equipment}', [\App\Http\Controllers\Api\V1\Equipment\EquipmentController::class, 'logMaintenance'])
            ->middleware('permission:partner.update');
    });

    // --- Commission Module ---
    Route::prefix('commission')->controller(CommissionController::class)->group(function () {
        // Global Dashboard (system-wide — Commission Dashboard Page)
        Route::get('/dashboard',                  'globalDashboard')->middleware('permission:partner.view');

        // Per-partner summary
        Route::get('/summary/{partner}',          'summary')->middleware('permission:partner.view');

        // Commission Rules CRUD
        Route::post('/rules/{partner}',           'storeRule')->middleware('permission:partner.update');
        Route::put('/rules/{rule}',               'updateRule')->middleware('permission:partner.update');
        Route::delete('/rules/{rule}',            'deactivateRule')->middleware('permission:partner.update');

        // Commission Records
        Route::post('/records/{partner}',         'storeCommission')->middleware('permission:partner.update');

        Route::post('/{commission}/approve',      'approve')->middleware('permission:partner.approve');
        Route::post('/{commission}/reject',       'reject')->middleware('permission:partner.approve');
        Route::post('/{commission}/pay',          'pay')->middleware('permission:partner.approve');
        Route::post('/{commission}/reverse',      'reverse')->middleware('permission:partner.approve');
    });

    // --- Audit Logs ---
    Route::get('/audit-logs', [AuditLogController::class, 'index'])
        ->middleware('permission:audit-log.view')
        ->name('audit-logs.index');

});
