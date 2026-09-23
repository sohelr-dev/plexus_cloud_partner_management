<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (prefix: /api/v1)
|--------------------------------------------------------------------------
| Convention (MASTER_PLAN §16):
|   - Sanctum token auth
|   - JSON response: { data, meta, message }
|   - Pagination:    ?page=1&per_page=20
|   - Filters:       ?search=&status=&date_from=&date_to=
*/

Route::get('/health', HealthController::class)->name('api.health');

// Auth endpoints will be added in Phase 2 (login/logout/me — Sanctum).
