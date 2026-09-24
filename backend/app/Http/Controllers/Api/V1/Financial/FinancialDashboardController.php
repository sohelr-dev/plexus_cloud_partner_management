<?php

namespace App\Http\Controllers\Api\V1\Financial;

use App\Http\Controllers\Controller;
use App\Models\Financial\PartnerProfitLoss;
use App\Models\Financial\PartnerRoi;
use App\Models\Partner\Partner;
use App\Services\FinancialCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinancialDashboardController extends Controller
{
    /**
     * Global financial summary for dashboard cards
     */
    public function summary(Request $request): JsonResponse
    {
        $filters = [
            'partner_id' => $request->query('partner_id'),
            'start_date' => $request->query('start_date'),
            'end_date'   => $request->query('end_date'),
        ];

        $summary = FinancialCalculationService::getGlobalFinancialSummary($filters);

        return response()->json([
            'data' => $summary,
        ]);
    }

    /**
     * Get or compute P&L snapshot for a specific partner
     */
    public function pnl(Partner $partner, Request $request): JsonResponse
    {
        $periodKey = $request->query('period_key', now()->format('Y-m'));

        $pnl = FinancialCalculationService::calculatePnL($partner, $periodKey);

        return response()->json([
            'data' => $pnl,
        ]);
    }

    /**
     * Get ROI metrics for a partner or list all ROI records 
     */
    public function roi(Request $request): JsonResponse
    {
        $query = PartnerRoi::with('partner:id,partner_name,partner_id');

        if ($partnerId = $request->query('partner_id')) {
            $query->where('partner_id', $partnerId);
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }
}
