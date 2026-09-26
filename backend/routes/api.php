<?php

use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Commission\CommissionController;
use App\Http\Controllers\Api\V1\Document\DocumentController;
use App\Http\Controllers\Api\V1\Document\ProfileExportController;
use App\Http\Controllers\Api\V1\Financial\CostController;
use App\Http\Controllers\Api\V1\Financial\FinancialDashboardController;
use App\Http\Controllers\Api\V1\Financial\PaymentController;
use App\Http\Controllers\Api\V1\Financial\RevenueController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\Partner\PartnerController;
use App\Http\Controllers\Api\V1\Partner\PartnerHistoryController;
use App\Http\Controllers\Api\V1\Partner\PartnerNoteController;
use App\Http\Controllers\Api\V1\Partner\SupportCenterController;
use App\Http\Controllers\Api\V1\Bandwidth\BandwidthController;
use App\Http\Controllers\Api\V1\Equipment\EquipmentController;
use App\Http\Controllers\Api\V1\Marketing\MarketingController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, '__invoke'])->name('api.health');

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');

    // Protected auth routes (need valid token)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/me',      [AuthController::class, 'me'])->name('auth.me');
    });
});

Route::middleware('auth:sanctum')->group(function () {

    // --- Partners ---
    Route::prefix('partners')->group(function () {
        Route::get('/lookups',              [PartnerController::class, 'lookups'])->middleware('permission:partner.view')->name('partners.lookups');
        Route::get('/',                     [PartnerController::class, 'index'])->middleware('permission:partner.view')->name('partners.index');
        Route::post('/',                    [PartnerController::class, 'store'])->middleware('permission:partner.create')->name('partners.store');
        Route::get('/{partner}',            [PartnerController::class, 'show'])->middleware('permission:partner.view')->name('partners.show');
        Route::match(['put', 'patch'], '/{partner}', [PartnerController::class, 'update'])->middleware('permission:partner.update')->name('partners.update');
        Route::put('/{partner}/status',     [PartnerController::class, 'changeStatus'])->middleware('permission:partner.update')->name('partners.status');
        Route::post('/{partner}/approve',   [PartnerController::class, 'approve'])->middleware('permission:partner.approve')->name('partners.approve');
        Route::delete('/{partner}',         [PartnerController::class, 'destroy'])->middleware('permission:partner.delete')->name('partners.destroy');
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

    // --- Bandwidth Module  ---
    Route::prefix('bandwidth')->group(function () {
        Route::get('/summary/{partner}', [BandwidthController::class, 'summary'])
            ->middleware('permission:partner.view');
        Route::post('/allocations/{partner}', [BandwidthController::class, 'storeAllocation'])
            ->middleware('permission:partner.update');
        Route::post('/change-requests/{partner}', [BandwidthController::class, 'requestChange'])
            ->middleware('permission:partner.update');
        Route::get('/pending-approvals', [BandwidthController::class, 'pendingApprovals'])
            ->middleware('permission:partner.approve');
        Route::post('/changes/{change}/approve', [BandwidthController::class, 'approveChange'])
            ->middleware('permission:partner.approve');
        Route::post('/changes/{change}/reject', [BandwidthController::class, 'rejectChange'])
            ->middleware('permission:partner.approve');
    });

    // --- Equipment & End Devices Module ---
    Route::prefix('equipment')->group(function () {
        Route::get('/summary/{partner}', [EquipmentController::class, 'summary'])
            ->middleware('permission:partner.view');
        Route::post('/assets/{partner}', [EquipmentController::class, 'storeEquipment'])
            ->middleware('permission:partner.update');
        Route::post('/end-devices/{partner}', [EquipmentController::class, 'storeEndDevice'])
            ->middleware('permission:partner.update');
        Route::post('/maintenance/{equipment}', [EquipmentController::class, 'logMaintenance'])
            ->middleware('permission:partner.update');
        Route::post('/{equipment}/replace', [EquipmentController::class, 'replace'])
            ->middleware('permission:partner.update');
        Route::post('/{equipment}/return', [EquipmentController::class, 'returnEquipment'])
            ->middleware('permission:partner.update');
    });

    // --- Commission Module ---
    Route::prefix('commission')->group(function () {
        // Global Dashboard (system-wide — Commission Dashboard Page)
        Route::get('/dashboard',                  [CommissionController::class, 'globalDashboard'])->middleware('permission:partner.view');

        // Per-partner summary
        Route::get('/summary/{partner}',          [CommissionController::class, 'summary'])->middleware('permission:partner.view');

        // Commission Rules CRUD
        Route::post('/rules/{partner}',           [CommissionController::class, 'storeRule'])->middleware('permission:partner.update');
        Route::put('/rules/{rule}',               [CommissionController::class, 'updateRule'])->middleware('permission:partner.update');
        Route::delete('/rules/{rule}',            [CommissionController::class, 'deactivateRule'])->middleware('permission:partner.update');

        // Commission Records
        Route::post('/records/{partner}',         [CommissionController::class, 'storeCommission'])->middleware('permission:partner.update');

        Route::post('/{commission}/approve',      [CommissionController::class, 'approve'])->middleware('permission:partner.approve');
        Route::post('/{commission}/reject',       [CommissionController::class, 'reject'])->middleware('permission:partner.approve');
        Route::post('/{commission}/pay',          [CommissionController::class, 'pay'])->middleware('permission:partner.approve');
        Route::post('/{commission}/reverse',      [CommissionController::class, 'reverse'])->middleware('permission:partner.approve');
    });

    //Support Center Module
    Route::prefix('partners/{partner}/support-centers')->group(function () {
        Route::get('/',                    [SupportCenterController::class, 'index'])->middleware('permission:partner.view');
        Route::post('/',                   [SupportCenterController::class, 'store'])->middleware('permission:partner.update');
    });

    Route::prefix('support-centers')->group(function () {
        Route::match(['put', 'patch'], '/{center}',           [SupportCenterController::class, 'update'])->middleware('permission:partner.update');
        Route::put('/{center}/status',                       [SupportCenterController::class, 'changeStatus'])->middleware('permission:partner.approve');
        Route::get('/{center}/staff',                        [SupportCenterController::class, 'staff'])->middleware('permission:partner.view');
        Route::post('/{center}/staff',                       [SupportCenterController::class, 'storeStaff'])->middleware('permission:partner.update');
        Route::get('/{center}/services',                     [SupportCenterController::class, 'services'])->middleware('permission:partner.view');
        Route::post('/{center}/services',                    [SupportCenterController::class, 'storeService'])->middleware('permission:partner.update');
        Route::get('/{center}/equipment',                    [SupportCenterController::class, 'equipment'])->middleware('permission:partner.view');
        Route::post('/{center}/equipment',                   [SupportCenterController::class, 'storeEquipment'])->middleware('permission:partner.update');
        Route::match(['put', 'patch'], '/{center}/equipment/{equipment}', [SupportCenterController::class, 'updateEquipment'])->middleware('permission:partner.update');
        Route::delete('/{center}/equipment/{equipment}',     [SupportCenterController::class, 'deleteEquipment'])->middleware('permission:partner.update');
        Route::get('/{center}/costs',                        [SupportCenterController::class, 'costs'])->middleware('permission:partner.view');
        Route::post('/{center}/costs',                       [SupportCenterController::class, 'storeCost'])->middleware('permission:partner.update');
        Route::match(['put', 'patch'], '/{center}/costs/{cost}', [SupportCenterController::class, 'updateCost'])->middleware('permission:partner.update');
        Route::delete('/{center}/costs/{cost}',              [SupportCenterController::class, 'deleteCost'])->middleware('permission:partner.update');
        Route::get('/{center}/performance',                  [SupportCenterController::class, 'performance'])->middleware('permission:partner.view');
        Route::get('/{center}/history',                      [SupportCenterController::class, 'history'])->middleware('permission:partner.view');
    });

    // --- SC Staff / Service direct resource routes ---
    Route::prefix('support-center-staff')->group(function () {
        Route::match(['put', 'patch'], '/{staff}', [SupportCenterController::class, 'updateStaff'])->middleware('permission:partner.update');
        Route::delete('/{staff}',                [SupportCenterController::class, 'deleteStaff'])->middleware('permission:partner.update');
    });

    Route::prefix('support-center-services')->group(function () {
        Route::match(['put', 'patch'], '/{service}', [SupportCenterController::class, 'updateService'])->middleware('permission:partner.update');
        Route::delete('/{service}',                 [SupportCenterController::class, 'deleteService'])->middleware('permission:partner.update');
    });

    // --- Global Support Center Dashboard ---
    Route::get('/support-centers/global-dashboard', [SupportCenterController::class, 'globalDashboard'])->middleware('permission:partner.view');

    // --- Marketing Module ---
    Route::prefix('marketing')->group(function () {
        Route::get('/{partner}/summary',             [MarketingController::class, 'summary'])->middleware('permission:partner.view');
        Route::get('/{partner}/customer-growth',     [MarketingController::class, 'getCustomerGrowth'])->middleware('permission:partner.view');
        Route::post('/{partner}/customer-growth',    [MarketingController::class, 'storeCustomerMetric'])->middleware('permission:partner.update');
        Route::get('/{partner}/sales-performance',   [MarketingController::class, 'getSalesPerformance'])->middleware('permission:partner.view');
        Route::post('/{partner}/sales-performance',  [MarketingController::class, 'storeSalesMetric'])->middleware('permission:partner.update');
        Route::get('/{partner}/package-performance', [MarketingController::class, 'getPackagePerformance'])->middleware('permission:partner.view');
        Route::get('/{partner}/area-metrics',        [MarketingController::class, 'getAreaMetrics'])->middleware('permission:partner.view');

        Route::get('/{partner}/campaigns',           [MarketingController::class, 'getCampaigns'])->middleware('permission:partner.view');
        Route::post('/{partner}/campaigns',          [MarketingController::class, 'storeCampaign'])->middleware('permission:partner.update');
        Route::match(['put', 'patch'], '/campaigns/{campaign}', [MarketingController::class, 'updateCampaign'])->middleware('permission:partner.update');
        Route::delete('/campaigns/{campaign}',       [MarketingController::class, 'destroyCampaign'])->middleware('permission:partner.update');
    });

    // --- Audit Logs ---
    Route::get('/audit-logs', [AuditLogController::class, 'index'])
        ->middleware('permission:audit-log.view')
        ->name('audit-logs.index');


    // --- Documents
    Route::prefix('partners/{partner}/documents')->group(function () {
        Route::get('/',                  [DocumentController::class, 'index'])->middleware('permission:document.view')->name('documents.index');
        Route::post('/',                 [DocumentController::class, 'store'])->middleware('permission:document.upload')->name('documents.store');
        Route::get('/expiry-alerts',     [DocumentController::class, 'expiryAlerts'])->middleware('permission:document.view')->name('documents.expiry-alerts');
    });

    Route::prefix('documents')->group(function () {
        Route::get('/expiry-dashboard',        [DocumentController::class, 'globalExpiryDashboard'])->middleware('permission:document.view')->name('documents.expiry-dashboard');
        Route::get('/{document}',              [DocumentController::class, 'show'])->middleware('permission:document.view')->name('documents.show');
        Route::match(['put', 'patch'], '/{document}', [DocumentController::class, 'update'])->middleware('permission:document.upload')->name('documents.update');
        Route::post('/{document}/versions',    [DocumentController::class, 'addVersion'])->middleware('permission:document.upload')->name('documents.versions.store');
        Route::get('/{document}/versions',     [DocumentController::class, 'versions'])->middleware('permission:document.view')->name('documents.versions.index');
        Route::put('/{document}/status',       [DocumentController::class, 'changeStatus'])->middleware('permission:document.upload')->name('documents.status');
        Route::delete('/{document}',           [DocumentController::class, 'destroy'])->middleware('permission:document.delete')->name('documents.destroy');
    });

    Route::post('/document-expiry/{alert}/acknowledge', [DocumentController::class, 'acknowledgeAlert'])
        ->middleware('permission:document.upload')
        ->name('documents.expiry.acknowledge');

    // --- Partner History / Timeline 
    Route::prefix('partners/{partner}/history')->group(function () {
        Route::get('/',         [PartnerHistoryController::class, 'index'])->middleware('permission:partner.view')->name('partners.history.index');
        Route::get('/summary',  [PartnerHistoryController::class, 'summary'])->middleware('permission:partner.view')->name('partners.history.summary');
        Route::post('/',        [PartnerHistoryController::class, 'store'])->middleware('permission:partner.update')->name('partners.history.store');
    });

    // --- Partner Notes 
    Route::prefix('partners/{partner}/notes')->group(function () {
        Route::get('/',   [PartnerNoteController::class, 'index'])->middleware('permission:note.view')->name('partners.notes.index');
        Route::post('/',  [PartnerNoteController::class, 'store'])->middleware('permission:note.create')->name('partners.notes.store');
    });

    Route::prefix('notes')->group(function () {
        Route::match(['put', 'patch'], '/{note}', [PartnerNoteController::class, 'update'])->middleware('permission:note.update')->name('notes.update');
        Route::put('/{note}/pin',                [PartnerNoteController::class, 'togglePin'])->middleware('permission:note.update')->name('notes.pin');
        Route::delete('/{note}',                 [PartnerNoteController::class, 'destroy'])->middleware('permission:note.delete')->name('notes.destroy');
    });

    // --- Partner Profile Export-
    Route::prefix('partners/{partner}/export')->group(function () {
        Route::get('/options', [ProfileExportController::class, 'options'])->middleware('permission:report.view')->name('partners.export.options');
        Route::get('/preview', [ProfileExportController::class, 'preview'])->middleware('permission:report.view')->name('partners.export.preview');
        Route::get('/',        [ProfileExportController::class, 'export'])->middleware('permission:report.export')->name('partners.export.download');
    });
});
