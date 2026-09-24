<?php

use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
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

    // --- Audit Logs ---
    Route::get('/audit-logs', [AuditLogController::class, 'index'])
        ->middleware('permission:audit-log.view')
        ->name('audit-logs.index');

});
