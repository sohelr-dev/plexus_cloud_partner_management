<?php

namespace App\Http\Controllers\Api\V1\Financial;

use App\Http\Controllers\Controller;
use App\Models\Financial\PartnerRevenue;
use App\Models\Partner\Partner;
use App\Services\AuditLogService;
use App\Services\FinancialCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RevenueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PartnerRevenue::with(['partner:id,partner_name,partner_id,partner_code', 'creator:id,name'])
            ->latest('revenue_date');

        if ($partnerId = $request->query('partner_id')) {
            $query->where('partner_id', $partnerId);
        }

        if ($source = $request->query('revenue_source')) {
            $query->where('revenue_source', $source);
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('source_reference', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('revenue_source', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->query('per_page', 20), 100);

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'partner_id'       => ['required', 'exists:partners,id'],
            'revenue_date'     => ['required', 'date'],
            'revenue_source'   => ['required', 'string', 'max:100'],
            'source_reference' => ['nullable', 'string', 'max:100'],
            'source_system'    => ['nullable', 'string', 'max:100'],
            'amount'           => ['required', 'numeric', 'gt:0'],
            'description'      => ['nullable', 'string'],
        ]);

        $validated['created_by'] = $request->user()?->id;

        $revenue = PartnerRevenue::create($validated);

        // Recalculate P&L for the partner
        $partner = Partner::find($validated['partner_id']);
        if ($partner) {
            FinancialCalculationService::calculatePnL($partner);
        }

        AuditLogService::log(
            action: 'created',
            entity: $revenue,
            newValues: $revenue->toArray(),
            reason: "Recorded revenue of ৳{$revenue->amount} from {$revenue->revenue_source}"
        );

        return response()->json([
            'message' => 'Revenue recorded successfully.',
            'data'    => $revenue->load(['partner:id,partner_name', 'creator:id,name']),
        ], 201);
    }

    public function destroy(PartnerRevenue $revenue): JsonResponse
    {
        $partner = $revenue->partner;
        $revenue->delete(); // soft delete BR-06

        if ($partner) {
            FinancialCalculationService::calculatePnL($partner);
        }

        AuditLogService::log(
            action: 'deleted',
            entity: $revenue,
            reason: "Soft-deleted revenue entry #{$revenue->id}"
        );

        return response()->json(['message' => 'Revenue entry deleted successfully.']);
    }
}
