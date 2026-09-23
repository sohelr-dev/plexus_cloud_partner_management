<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /**
     * GET /api/v1/health — simple liveness probe for the React app.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'app' => config('app.name'),
                'status' => 'ok',
                'time' => now()->toIso8601String(),
            ],
            'message' => 'API is running',
        ]);
    }
}
