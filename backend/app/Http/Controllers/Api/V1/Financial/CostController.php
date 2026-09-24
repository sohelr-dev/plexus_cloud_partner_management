<?php

namespace App\Http\Controllers\Api\V1\Financial;

use App\Http\Controllers\Controller;
use App\Models\Financial\PartnerCost;
use App\Models\Partner\Partner;
use App\Services\AuditLogService;
use App\Services\FinancialCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PartnerCost::with(['partner:id,partner_name,partner_id,partner_code', 'creator:id,name'])
            ->latest('cost_date');

        if ($partnerId = $request->query('partner_id')) {
            $query->where('partner_id', $partnerId);
        }

        if ($type = $request->query('cost_type')) {
            $query->where('cost_type', $type);
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('source_reference', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('cost_type', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->query('per_page', 20), 100);

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'partner_id'       => ['required', 'exists:partners,id'],
            'cost_date'        => ['required', 'date'],
            'cost_type'        => ['required', 'string', 'max:100'],
            'source_reference' => ['nullable', 'string', 'max:100'],
            'source_system'    => ['nullable', 'string', 'max:100'],
            'amount'           => ['required', 'numeric', 'gt:0'],
            'description'      => ['nullable', 'string'],
        ]);

        $validated['created_by'] = $request->user()?->id;

        $cost = PartnerCost::create($validated);

        // Recalculate P&L for partner
        $partner = Partner::find($validated['partner_id']);
        if ($partner) {
            FinancialCalculationService::calculatePnL($partner);
        }

        AuditLogService::log(
            action: 'created',
            entity: $cost,
            newValues: $cost->toArray(),
            reason: "Recorded cost of ৳{$cost->amount} for {$cost->cost_type}"
        );

        return response()->json([
            'message' => 'Cost entry recorded successfully.',
            'data'    => $cost->load(['partner:id,partner_name', 'creator:id,name']),
        ], 201);
    }

    public function destroy(PartnerCost $cost): JsonResponse
    {
        $partner = $cost->partner;
        $cost->delete(); // soft delete BR-06

        if ($partner) {
            FinancialCalculationService::calculatePnL($partner);
        }

        AuditLogService::log(
            action: 'deleted',
            entity: $cost,
            reason: "Soft-deleted cost entry #{$cost->id}"
        );

        return response()->json(['message' => 'Cost entry deleted successfully.']);
    }
}
