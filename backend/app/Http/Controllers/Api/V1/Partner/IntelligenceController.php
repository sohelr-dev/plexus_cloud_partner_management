<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Partner\Partner;
use App\Services\PartnerHealthService;
use App\Services\PartnerInsightService;
use App\Services\PartnerRiskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntelligenceController extends ApiController
{
    public function dashboard(Request $request, Partner $partner): JsonResponse
    {
        $latest  = PartnerHealthService::latest($partner);
        $risks   = PartnerRiskService::active($partner);
        $insights = PartnerInsightService::latest($partner);
        $history = PartnerHealthService::history($partner, 12);

        return $this->success([
            'health' => $latest ? [
                'total_score'             => $latest->total_score,
                'status'                  => $latest->status,
                'financial_health_score'  => $latest->financial_health_score,
                'revenue_growth_score'    => $latest->revenue_growth_score,
                'profitability_score'     => $latest->profitability_score,
                'payment_behavior_score'  => $latest->payment_behavior_score,
                'bandwidth_growth_score'  => $latest->bandwidth_growth_score,
                'customer_growth_score'   => $latest->customer_growth_score,
                'operational_score'       => $latest->operational_score,
                'calculation_data'        => $latest->calculation_data,
                'period'                  => $latest->period,
                'calculated_at'           => $latest->calculated_at,
            ] : null,
            'risks'           => $risks,
            'risk_summary'    => PartnerRiskService::summary($partner),
            'insights'        => $insights['insights'],
            'recommendations' => $insights['recommendations'],
            'score_history'   => $history->map(fn($h) => [
                'total_score'  => $h->total_score,
                'status'       => $h->status,
                'period'       => $h->period,
                'calculated_at'=> $h->calculated_at,
            ]),
        ], 'Intelligence dashboard loaded.');
    }

    public function recalculate(Request $request, Partner $partner): JsonResponse
    {
        $score    = PartnerHealthService::calculate($partner, $request->user());
        $risks    = PartnerRiskService::detect($partner, $request->user());
        $insights = PartnerInsightService::generate($partner);

        return $this->success([
            'health' => [
                'total_score' => $score->total_score,
                'status'      => $score->status,
                'period'      => $score->period,
            ],
            'risks_detected'    => count($risks),
            'insights_generated' => count($insights),
        ], 'Health score recalculated successfully.');
    }

    public function scoreHistory(Request $request, Partner $partner): JsonResponse
    {
        $limit   = (int) $request->get('limit', 12);
        $history = PartnerHealthService::history($partner, $limit);

        return $this->success($history, 'Score history loaded.');
    }

    public function risks(Request $request, Partner $partner): JsonResponse
    {
        $category = $request->get('category');
        $severity = $request->get('severity');

        $query = \App\Models\Intelligence\PartnerRiskIndicator::where('partner_id', $partner->id)
            ->where('is_active', true);

        if ($category) $query->where('risk_category', $category);
        if ($severity) $query->where('severity', $severity);

        $risks = $query->orderByRaw("FIELD(severity, 'Critical','High','Medium','Low')")->get();

        return $this->success([
            'risks'   => $risks,
            'summary' => PartnerRiskService::summary($partner),
        ], 'Risk indicators loaded.');
    }
}
