<?php

namespace App\Services;

use App\Models\Bandwidth\PartnerBandwidthAllocation;
use App\Models\Bandwidth\PartnerBandwidthApproval;
use App\Models\Bandwidth\PartnerBandwidthChange;
use App\Models\Bandwidth\PartnerBandwidthHistory;
use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BandwidthManagementService
{
    /**
     * Get consolidated bandwidth summary for a partner.
     */
    public static function getBandwidthSummary(Partner $partner): array
    {
        $allocations = PartnerBandwidthAllocation::where('partner_id', $partner->id)->get();

        $totalAllocated = $allocations->where('status', 'Active')->sum('allocated_mbps');
        $totalUsed      = $allocations->where('status', 'Active')->sum('used_mbps');
        $totalAvailable = max(0, $totalAllocated - $totalUsed);
        $avgUtilization = $totalAllocated > 0 ? round(($totalUsed / $totalAllocated) * 100, 2) : 0;
        $totalMonthlyCost = $allocations->where('status', 'Active')->sum('cost');
        $totalMonthlyRevenue = $allocations->where('status', 'Active')->sum('price');

        $pendingRequestsCount = PartnerBandwidthChange::where('partner_id', $partner->id)
            ->whereIn('status', ['Requested', 'Capacity Check', 'Commercial Review'])
            ->count();

        return [
            'total_allocated_mbps'  => $totalAllocated,
            'total_used_mbps'       => $totalUsed,
            'total_available_mbps'  => $totalAvailable,
            'utilization_percent'   => $avgUtilization,
            'monthly_cost'          => $totalMonthlyCost,
            'monthly_revenue'       => $totalMonthlyRevenue,
            'pending_requests'      => $pendingRequestsCount,
            'allocations'           => $allocations,
        ];
    }

    /**
     * Submit a bandwidth change request (Upgrade / Downgrade / Temporary)
     * Includes pre-approval Impact Analysis (PRD Section 42).
     */
    public static function submitChangeRequest(Partner $partner, array $data, ?User $requester = null): PartnerBandwidthChange
    {
        return DB::transaction(function () use ($partner, $data, $requester) {
            $allocation = PartnerBandwidthAllocation::findOrFail($data['allocation_id']);

            $previousMbps = $allocation->allocated_mbps;
            $newMbps      = (float)$data['new_mbps'];
            $diffMbps     = $newMbps - $previousMbps;

            // Calculate Impact Analysis (PRD Section 42)
            // Price per Mbps = current price / current mbps (or price field)
            $unitPrice = $previousMbps > 0 ? ($allocation->price / $previousMbps) : (float)($data['unit_price'] ?? 100);
            $unitCost  = $previousMbps > 0 ? ($allocation->cost / $previousMbps) : (float)($data['unit_cost'] ?? 70);

            $revenueImpact = $diffMbps * $unitPrice;
            $costImpact    = $diffMbps * $unitCost;
            $profitImpact  = $revenueImpact - $costImpact;

            $changeType = $data['change_type'] ?? ($diffMbps >= 0 ? 'Upgrade' : 'Downgrade');

            $change = PartnerBandwidthChange::create([
                'partner_id'          => $partner->id,
                'allocation_id'       => $allocation->id,
                'change_type'         => $changeType,
                'previous_mbps'       => $previousMbps,
                'new_mbps'            => $newMbps,
                'difference_mbps'     => $diffMbps,
                'revenue_impact'      => $revenueImpact,
                'cost_impact'         => $costImpact,
                'profit_impact'       => $profitImpact,
                'reason'              => $data['reason'] ?? null,
                'effective_date'      => $data['effective_date'] ?? Carbon::now()->toDateString(),
                'requester_id'        => $requester ? $requester->id : auth()->id(),
                'supporting_document' => $data['supporting_document'] ?? null,
                'status'              => 'Requested',
            ]);

            // Create initial pending approval entry
            PartnerBandwidthApproval::create([
                'change_id'      => $change->id,
                'approval_level' => 1,
                'status'         => 'Pending',
            ]);

            // Record history event
            PartnerBandwidthHistory::create([
                'partner_id'     => $partner->id,
                'allocation_id'  => $allocation->id,
                'change_id'      => $change->id,
                'event_type'     => $changeType . ' Requested',
                'previous_value' => $previousMbps,
                'new_value'      => $newMbps,
                'changed_by'     => $requester ? $requester->id : auth()->id(),
                'changed_at'     => now(),
                'remarks'        => "Requested {$changeType} from {$previousMbps} Mbps to {$newMbps} Mbps.",
            ]);

            return $change;
        });
    }

    /**
     * Approve a bandwidth change request (BR-08: Approval Mandatory).
     */
    public static function approveChange(PartnerBandwidthChange $change, User $approver, ?string $reason = null): PartnerBandwidthChange
    {
        return DB::transaction(function () use ($change, $approver, $reason) {
            $change->status = 'Approved';
            $change->approver_id = $approver->id;
            $change->save();

            // Update Approval Record
            PartnerBandwidthApproval::where('change_id', $change->id)->update([
                'approver_id' => $approver->id,
                'status'      => 'Approved',
                'decision'    => 'Approved',
                'reason'      => $reason,
                'approved_at' => now(),
            ]);

            // Apply change to allocation
            $allocation = PartnerBandwidthAllocation::findOrFail($change->allocation_id);
            $oldMbps = $allocation->allocated_mbps;
            $allocation->allocated_mbps = $change->new_mbps;
            $allocation->available_mbps = max(0, $change->new_mbps - $allocation->used_mbps);
            if ($change->new_mbps > 0) {
                $allocation->utilization_percent = round(($allocation->used_mbps / $change->new_mbps) * 100, 2);
                // Adjust total monthly price & cost proportionally
                $allocation->price = max(0, $allocation->price + $change->revenue_impact);
                $allocation->cost  = max(0, $allocation->cost + $change->cost_impact);
            }
            $allocation->save();

            $change->status = 'Completed';
            $change->save();

            // Log history
            PartnerBandwidthHistory::create([
                'partner_id'     => $change->partner_id,
                'allocation_id'  => $allocation->id,
                'change_id'      => $change->id,
                'event_type'     => $change->change_type == 'Upgrade' ? 'Upgraded' : 'Downgraded',
                'previous_value' => $oldMbps,
                'new_value'      => $change->new_mbps,
                'changed_by'     => $approver->id,
                'changed_at'     => now(),
                'remarks'        => "Approved and applied change: {$oldMbps} Mbps -> {$change->new_mbps} Mbps.",
            ]);

            return $change;
        });
    }

    /**
     * Reject a bandwidth change request.
     */
    public static function rejectChange(PartnerBandwidthChange $change, User $approver, ?string $reason = null): PartnerBandwidthChange
    {
        return DB::transaction(function () use ($change, $approver, $reason) {
            $change->status = 'Rejected';
            $change->approver_id = $approver->id;
            $change->save();

            PartnerBandwidthApproval::where('change_id', $change->id)->update([
                'approver_id' => $approver->id,
                'status'      => 'Rejected',
                'decision'    => 'Rejected',
                'reason'      => $reason,
                'approved_at' => now(),
            ]);

            PartnerBandwidthHistory::create([
                'partner_id'     => $change->partner_id,
                'allocation_id'  => $change->allocation_id,
                'change_id'      => $change->id,
                'event_type'     => 'Request Rejected',
                'previous_value' => $change->previous_mbps,
                'new_value'      => $change->new_mbps,
                'changed_by'     => $approver->id,
                'changed_at'     => now(),
                'remarks'        => "Bandwidth change request rejected. Reason: {$reason}",
            ]);

            return $change;
        });
    }
}
