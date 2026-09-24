<?php

namespace App\Http\Controllers\Api\V1\Financial;

use App\Http\Controllers\Controller;
use App\Models\Financial\PartnerPayment;
use App\Models\Partner\Partner;
use App\Services\AuditLogService;
use App\Services\FinancialCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PartnerPayment::with(['partner:id,partner_name,partner_id,partner_code', 'creator:id,name'])
            ->latest('payment_date');

        if ($partnerId = $request->query('partner_id')) {
            $query->where('partner_id', $partnerId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                  ->orWhere('remarks', 'like', "%{$search}%")
                  ->orWhere('payment_method', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->query('per_page', 20), 100);

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'partner_id'       => ['required', 'exists:partners,id'],
            'payment_date'     => ['required', 'date'],
            'payment_method'   => ['required', 'string', 'in:Cash,Bank Transfer,Cheque,Online,Adjustment'],
            'amount'           => ['required', 'numeric', 'gt:0'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'status'           => ['nullable', 'in:Pending,Completed,Failed,Reversed'],
            'remarks'          => ['nullable', 'string'],
        ]);

        $validated['created_by'] = $request->user()?->id;
        $validated['status']     = $validated['status'] ?? 'Completed';

        $payment = PartnerPayment::create($validated);

        // Recalculate P&L for partner
        $partner = Partner::find($validated['partner_id']);
        if ($partner) {
            FinancialCalculationService::calculatePnL($partner);
        }

        AuditLogService::log(
            action: 'created',
            entity: $payment,
            newValues: $payment->toArray(),
            reason: "Recorded payment of ৳{$payment->amount} via {$payment->payment_method}"
        );

        return response()->json([
            'message' => 'Payment entry recorded successfully.',
            'data'    => $payment->load(['partner:id,partner_name', 'creator:id,name']),
        ], 201);
    }

    public function destroy(PartnerPayment $payment): JsonResponse
    {
        $partner = $payment->partner;
        $payment->delete(); // soft delete BR-06

        if ($partner) {
            FinancialCalculationService::calculatePnL($partner);
        }

        AuditLogService::log(
            action: 'deleted',
            entity: $payment,
            reason: "Soft-deleted payment entry #{$payment->id}"
        );

        return response()->json(['message' => 'Payment entry deleted successfully.']);
    }
}
