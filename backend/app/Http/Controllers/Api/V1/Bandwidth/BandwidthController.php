<?php

namespace App\Http\Controllers\Api\V1\Bandwidth;

use App\Http\Controllers\Controller;
use App\Models\Bandwidth\PartnerBandwidthAllocation;
use App\Models\Bandwidth\PartnerBandwidthChange;
use App\Models\Partner\Partner;
use App\Services\AuditLogService;
use App\Services\BandwidthManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BandwidthController extends Controller
{
    /**
     * Get bandwidth summary and allocations for a partner.
     */
    public function summary(Partner $partner): JsonResponse
    {
        $summary = BandwidthManagementService::getBandwidthSummary($partner);
        
        $changes = PartnerBandwidthChange::where('partner_id', $partner->id)
            ->with(['allocation', 'requester', 'approver'])
            ->orderBy('created_at', 'desc')
            ->get();

        $history = $partner->bandwidthHistories()
            ->with(['changedBy', 'allocation'])
            ->orderBy('changed_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => array_merge($summary, [
                'changes' => $changes,
                'history' => $history,
            ]),
        ]);
    }

    /**
     * Create a new bandwidth allocation for a partner.
     */
    public function storeAllocation(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'service'        => 'required|string|in:Internet,GGC,FNA,BDIX,Other',
            'allocated_mbps' => 'required|numeric|min:0.1',
            'ratio'          => 'nullable|string|max:20',
            'price'          => 'required|numeric|min:0',
            'cost'           => 'required|numeric|min:0',
            'effective_date' => 'nullable|date',
            'expiry_date'    => 'nullable|date|after_or_equal:effective_date',
            'work_order_id'  => 'nullable|string|max:100',
        ]);

        $allocated = (float)$validated['allocated_mbps'];

        $allocation = PartnerBandwidthAllocation::create([
            'partner_id'          => $partner->id,
            'service'             => $validated['service'],
            'allocated_mbps'      => $allocated,
            'used_mbps'           => 0,
            'available_mbps'      => $allocated,
            'utilization_percent' => 0,
            'ratio'               => $validated['ratio'] ?? '1:1',
            'price'               => $validated['price'],
            'cost'                => $validated['cost'],
            'effective_date'      => $validated['effective_date'] ?? now()->toDateString(),
            'expiry_date'         => $validated['expiry_date'] ?? null,
            'status'              => 'Active',
            'work_order_id'       => $validated['work_order_id'] ?? ('WO-' . date('Ymd') . '-' . strtoupper(Str::random(4))),
        ]);

        AuditLogService::log(
            'bandwidth.allocated',
            $partner,
            null,
            $allocation->toArray(),
            "Allocated {$allocated} Mbps {$validated['service']} service to partner."
        );

        return response()->json([
            'success' => true,
            'message' => 'Bandwidth allocation created successfully.',
            'data'    => $allocation,
        ], 201);
    }

    /**
     * Submit a bandwidth change (Upgrade / Downgrade) request.
     */
    public function requestChange(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'allocation_id'       => 'required|exists:partner_bandwidth_allocations,id',
            'new_mbps'            => 'required|numeric|min:0',
            'change_type'         => 'nullable|string|in:Upgrade,Downgrade,Temporary,Emergency,Administrative',
            'reason'              => 'nullable|string|max:1000',
            'effective_date'      => 'nullable|date',
            'unit_price'          => 'nullable|numeric|min:0',
            'unit_cost'           => 'nullable|numeric|min:0',
            'supporting_document' => 'nullable|string|max:500',
        ]);

        $change = BandwidthManagementService::submitChangeRequest($partner, $validated, $request->user());

        AuditLogService::log(
            'bandwidth.change_requested',
            $partner,
            null,
            $change->toArray(),
            "Requested bandwidth change to {$change->new_mbps} Mbps (Impact: ৳{$change->profit_impact} profit)."
        );

        return response()->json([
            'success' => true,
            'message' => 'Bandwidth change request submitted successfully and sent for approval.',
            'data'    => $change,
        ], 201);
    }

    /**
     * List all pending bandwidth change requests system-wide.
     */
    public function pendingApprovals(): JsonResponse
    {
        $pending = PartnerBandwidthChange::whereIn('status', ['Requested', 'Capacity Check', 'Commercial Review'])
            ->with(['partner', 'allocation', 'requester'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $pending,
        ]);
    }

    /**
     * Approve a bandwidth change request (BR-08 Compliance).
     */
    public function approveChange(Request $request, PartnerBandwidthChange $change): JsonResponse
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $approvedChange = BandwidthManagementService::approveChange($change, $request->user(), $request->input('reason'));

        AuditLogService::log(
            'bandwidth.change_approved',
            $change->partner,
            null,
            $approvedChange->toArray(),
            "Approved bandwidth change request ID #{$change->id}."
        );

        return response()->json([
            'success' => true,
            'message' => 'Bandwidth change request approved and applied successfully.',
            'data'    => $approvedChange,
        ]);
    }

    /**
     * Reject a bandwidth change request.
     */
    public function rejectChange(Request $request, PartnerBandwidthChange $change): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $rejectedChange = BandwidthManagementService::rejectChange($change, $request->user(), $request->input('reason'));

        AuditLogService::log(
            'bandwidth.change_rejected',
            $change->partner,
            null,
            $rejectedChange->toArray(),
            "Rejected bandwidth change request ID #{$change->id}."
        );

        return response()->json([
            'success' => true,
            'message' => 'Bandwidth change request rejected.',
            'data'    => $rejectedChange,
        ]);
    }
}
