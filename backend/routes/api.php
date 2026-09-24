<?php

use App\Http\Controllers\Api\V1\AuthController;
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
        Route::get('/',                    'index')->name('partners.index');
        Route::post('/',                   'store')->name('partners.store');
        Route::get('/{partner}',           'show')->name('partners.show');
        Route::match(['put','patch'], '/{partner}', 'update')->name('partners.update');
        Route::delete('/{partner}',        'destroy')->name('partners.destroy');
    });

});
