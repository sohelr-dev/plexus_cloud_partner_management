<?php

namespace App\Services;

use App\Models\Commission\CommissionAdjustment;
use App\Models\Commission\CommissionPayment;
use App\Models\Commission\CommissionRule;
use App\Models\Commission\PartnerCommission;
use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Commission Engine .
 *
 * Lifecycle:  Generated → Pending → Calculated → Approved → Payable → Paid
 *             (+ Rejected / Cancelled / Reversed / Adjusted).
 */
class CommissionService
{

    public static function getSummary(Partner $partner): array
    {
        $now       = Carbon::now();
        $thisMonth = $now->month;
        $thisYear  = $now->year;
        $prevMonth = $now->copy()->subMonth()->month;
        $prevYear  = $now->copy()->subMonth()->year;

        $allCommissions = PartnerCommission::where('partner_id', $partner->id)->get();

        $byStatus = [];
        foreach (PartnerCommission::STATUSES as $status) {
            $byStatus[$status] = $allCommissions->where('status', $status)->sum('commission_amount');
        }

        $currentMonth = $allCommissions
            ->where('period_month', $thisMonth)
            ->where('period_year',  $thisYear)
            ->sum('commission_amount');

        $prevMonthTotal = $allCommissions
            ->where('period_month', $prevMonth)
            ->where('period_year',  $prevYear)
            ->sum('commission_amount');

        $ytd = $allCommissions
            ->where('period_year', $thisYear)
            ->sum('commission_amount');

        $rules = CommissionRule::where('partner_id', $partner->id)
            ->where('status', 'Active')
            ->get();

        $commissions = PartnerCommission::where('partner_id', $partner->id)
            ->with(['rule', 'approvedBy'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($c) => self::formatCommission($c));

        $payments = CommissionPayment::where('partner_id', $partner->id)
            ->orderByDesc('payment_date')
            ->get();

        return [
            'by_status'      => $byStatus,
            'current_month'  => $currentMonth,
            'previous_month' => $prevMonthTotal,
            'ytd'            => $ytd,
            'total_earned'   => $allCommissions->whereIn('status', ['Approved', 'Payable', 'Paid'])->sum('commission_amount'),
            'total_paid'     => $allCommissions->where('status', 'Paid')->sum('commission_amount'),
            'total_pending'  => $allCommissions->whereIn('status', ['Generated', 'Pending', 'Calculated'])->sum('commission_amount'),
            'active_rules'   => $rules->count(),
            'rules'          => $rules,
            'commissions'    => $commissions,
            'payments'       => $payments,
        ];
    }


    public static function createRule(Partner $partner, array $data): CommissionRule
    {
        $cleaned = self::cleanRuleData($data);
        return CommissionRule::create(array_merge($cleaned, ['partner_id' => $partner->id]));
    }

    public static function updateRule(CommissionRule $rule, array $data): CommissionRule
    {
        $cleaned = self::cleanRuleData($data);
        $rule->update($cleaned);
        return $rule->fresh();
    }

    private static function cleanRuleData(array $data): array
    {
        $fields = ['rate', 'fixed_amount', 'target', 'maximum_limit', 'effective_date', 'expiry_date', 'service', 'package_id'];
        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                if ($data[$field] === '' || $data[$field] === null) {
                    if (in_array($field, ['rate', 'fixed_amount', 'target', 'maximum_limit'])) {
                        $data[$field] = 0;
                    } else {
                        $data[$field] = null;
                    }
                }
            }
        }
        return $data;
    }

    public static function deactivateRule(CommissionRule $rule): CommissionRule
    {
        $rule->update(['status' => 'Inactive']);
        return $rule;
    }

    // Commission Calculation Engine 

    /**
     * Calculate commission amount for a given source_amount using a rule.
     * Revenue 100,000 × 5% = 5,000
     */
    public static function calculateAmount(CommissionRule $rule, float $sourceAmount): float
    {
        $amount = match ($rule->commission_type) {
            'Percentage',
            'Revenue Based',
            'Bandwidth Based' => $sourceAmount * ($rule->rate / 100),

            'Fixed Amount'    => (float) $rule->fixed_amount,

            'Per Customer',
            'Per Activation',
            'Per Renewal',
            'Per Package'     => (float) $rule->fixed_amount,   // flat per-unit rate

            'Custom'          => $rule->rate > 0
                ? $sourceAmount * ($rule->rate / 100)
                : (float) $rule->fixed_amount,

            default           => 0.0,
        };

        // Apply maximum limit cap
        if ($rule->maximum_limit > 0 && $amount > $rule->maximum_limit) {
            $amount = (float) $rule->maximum_limit;
        }

        return round($amount, 2);
    }

    /**
     * Generate a commission record from a revenue transaction (status → Generated).
     */
    public static function generateFromRevenue(
        Partner $partner,
        float   $sourceAmount,
        string  $sourceReference,
        int     $month,
        int     $year,
        ?int    $ruleId = null
    ): PartnerCommission {
        return DB::transaction(function () use ($partner, $sourceAmount, $sourceReference, $month, $year, $ruleId) {
            // Resolve rule: explicit rule or best active rule for partner
            $rule = $ruleId
                ? CommissionRule::find($ruleId)
                : CommissionRule::where('partner_id', $partner->id)
                    ->where('status', 'Active')
                    ->whereNull('expiry_date')
                    ->orWhere(fn($q) => $q
                        ->where('partner_id', $partner->id)
                        ->where('status', 'Active')
                        ->where('expiry_date', '>=', now()->toDateString()))
                    ->orderByDesc('effective_date')
                    ->first();

            $commissionAmount = $rule
                ? self::calculateAmount($rule, $sourceAmount)
                : 0.0;

            return PartnerCommission::create([
                'partner_id'        => $partner->id,
                'rule_id'           => $rule?->id,
                'source_reference'  => $sourceReference,
                'source_amount'     => $sourceAmount,
                'commission_amount' => $commissionAmount,
                'period_month'      => $month,
                'period_year'       => $year,
                'status'            => 'Generated',
                'generated_at'      => now(),
            ]);
        });
    }

    /**
     * Manually create a commission record (Admin / overriding engine).
     */
    public static function createManual(Partner $partner, array $data): PartnerCommission
    {
        return DB::transaction(function () use ($partner, $data) {
            $rule             = isset($data['rule_id']) ? CommissionRule::find($data['rule_id']) : null;
            $sourceAmount     = (float) ($data['source_amount'] ?? 0);
            $commissionAmount = isset($data['commission_amount'])
                ? (float) $data['commission_amount']
                : ($rule ? self::calculateAmount($rule, $sourceAmount) : 0.0);

            return PartnerCommission::create([
                'partner_id'        => $partner->id,
                'rule_id'           => $data['rule_id'] ?? null,
                'source_reference'  => $data['source_reference'] ?? null,
                'source_amount'     => $sourceAmount,
                'commission_amount' => $commissionAmount,
                'period_month'      => $data['period_month'] ?? now()->month,
                'period_year'       => $data['period_year'] ?? now()->year,
                'status'            => 'Generated',
                'generated_at'      => now(),
                'remarks'           => $data['remarks'] ?? null,
            ]);
        });
    }



    public static function approve(PartnerCommission $commission, User $approver, string $remarks = ''): PartnerCommission
    {
        if (! in_array($commission->status, ['Generated', 'Pending', 'Calculated'])) {
            throw new \RuntimeException("Cannot approve commission in status [{$commission->status}].");
        }

        $commission->update([
            'status'      => 'Approved',
            'approved_at' => now(),
            'approved_by' => $approver->id,
            'remarks'     => $remarks ?: $commission->remarks,
        ]);

        // Auto-advance to Payable after approval
        $commission->update(['status' => 'Payable']);

        return $commission->fresh()->load(['rule', 'approvedBy']);
    }

    /**
     * Reject a commission.
     */
    public static function reject(PartnerCommission $commission, string $reason): PartnerCommission
    {
        if (! in_array($commission->status, ['Generated', 'Pending', 'Calculated'])) {
            throw new \RuntimeException("Cannot reject commission in status [{$commission->status}].");
        }

        $commission->update([
            'status'  => 'Rejected',
            'remarks' => $reason,
        ]);

        return $commission->fresh();
    }


    public static function pay(
        PartnerCommission $commission,
        array             $paymentData,
        ?User             $createdBy = null
    ): CommissionPayment {
        if ($commission->status !== 'Payable') {
            throw new \RuntimeException(
                "Cannot pay commission in status [{$commission->status}]. Must be Payable (approved first — BR-09)."
            );
        }

        return DB::transaction(function () use ($commission, $paymentData, $createdBy) {
            $payment = CommissionPayment::create([
                'partner_id'       => $commission->partner_id,
                'commission_id'    => $commission->id,
                'payment_date'     => $paymentData['payment_date'] ?? now()->toDateString(),
                'amount'           => $paymentData['amount'] ?? $commission->commission_amount,
                'payment_method'   => $paymentData['payment_method'] ?? null,
                'reference_number' => $paymentData['reference_number'] ?? null,
                'status'           => 'Paid',
                'created_by'       => $createdBy?->id,
            ]);

            $commission->update([
                'status'  => 'Paid',
                'paid_at' => now(),
            ]);

            return $payment;
        });
    }

    public static function reverse(
        PartnerCommission $commission,
        string            $reason,
        ?User             $user = null
    ): CommissionAdjustment {
        if ($commission->status !== 'Paid') {
            throw new \RuntimeException("Only Paid commissions can be reversed.");
        }

        return DB::transaction(function () use ($commission, $reason, $user) {
            $adjustment = CommissionAdjustment::create([
                'partner_id'      => $commission->partner_id,
                'commission_id'   => $commission->id,
                'adjustment_type' => 'Reversal',
                'amount'          => $commission->commission_amount,
                'reason'          => $reason,
                'adjusted_by'     => $user?->id,
                'adjusted_at'     => now(),
            ]);

            $commission->update(['status' => 'Reversed']);

            return $adjustment;
        });
    }

    private static function formatCommission(PartnerCommission $c): array
    {
        return [
            'id'                => $c->id,
            'rule_id'           => $c->rule_id,
            'rule_name'         => $c->rule?->rule_name,
            'commission_type'   => $c->rule?->commission_type,
            'source_reference'  => $c->source_reference,
            'source_amount'     => $c->source_amount,
            'commission_amount' => $c->commission_amount,
            'period_month'      => $c->period_month,
            'period_year'       => $c->period_year,
            'status'            => $c->status,
            'generated_at'      => $c->generated_at?->toDateString(),
            'approved_at'       => $c->approved_at?->toDateString(),
            'paid_at'           => $c->paid_at?->toDateString(),
            'approved_by_name'  => $c->approvedBy?->name,
            'remarks'           => $c->remarks,
            'created_at'        => $c->created_at?->toDateString(),
        ];
    }
}
