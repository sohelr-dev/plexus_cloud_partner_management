<?php

namespace App\Http\Controllers\Api\V1\Commission;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Commission\CommissionRule;
use App\Models\Commission\PartnerCommission;
use App\Models\Commission\CommissionPayment;
use App\Models\Partner\Partner;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CommissionController extends ApiController
{

    public function globalDashboard(Request $request): JsonResponse
    {
        try {
            $now      = Carbon::now();
            $month    = $request->query('month',  $now->month);
            $year     = $request->query('year',   $now->year);
            $status   = $request->query('status', null);
            $partnerId = $request->query('partner_id', null);

            $query = PartnerCommission::with(['partner', 'rule', 'approvedBy'])
                ->orderByDesc('created_at');

            if ($status)    $query->where('status', $status);
            if ($partnerId) $query->where('partner_id', $partnerId);

            $all = PartnerCommission::query();
            if ($partnerId) $all->where('partner_id', $partnerId);
            $allCommissions = $all->get();

            // KPI totals
            $byStatus = [];
            foreach (PartnerCommission::STATUSES as $s) {
                $byStatus[$s] = $allCommissions->where('status', $s)->sum('commission_amount');
            }

            $currentMonth  = $allCommissions->where('period_month', $month)->where('period_year',  $year)->sum('commission_amount');
            $prevM         = $month == 1 ? 12 : $month - 1;
            $prevY         = $month == 1 ? $year - 1 : $year;
            $previousMonth = $allCommissions->where('period_month', $prevM)->where('period_year', $prevY)->sum('commission_amount');
            $ytd           = $allCommissions->where('period_year', $year)->sum('commission_amount');

            // Paginated records list (filtered)
            $records = $query->paginate(50);

            $formatted = $records->map(function ($c) {
                return [
                    'id'                => $c->id,
                    'partner_id'        => $c->partner_id,
                    'partner_name'      => $c->partner?->partner_name,
                    'partner_code'      => $c->partner?->partner_code,
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
            });

            // Partner breakdown (top 10 by commission)
            $partnerBreakdown = $allCommissions
                ->groupBy('partner_id')
                ->map(fn($group) => [
                    'partner_id'        => $group->first()?->partner_id,
                    'partner_name'      => $group->first()?->partner?->partner_name ?? 'Unknown',
                    'total'             => $group->sum('commission_amount'),
                    'paid'              => $group->where('status', 'Paid')->sum('commission_amount'),
                    'pending'           => $group->whereIn('status', ['Generated','Pending','Calculated'])->sum('commission_amount'),
                    'payable'           => $group->where('status', 'Payable')->sum('commission_amount'),
                    'count'             => $group->count(),
                ])
                ->sortByDesc('total')
                ->values()
                ->take(10);

            return $this->success([
                'kpis' => [
                    'by_status'      => $byStatus,
                    'current_month'  => $currentMonth,
                    'previous_month' => $previousMonth,
                    'ytd'            => $ytd,
                    'total_earned'   => $allCommissions->whereIn('status', ['Approved','Payable','Paid'])->sum('commission_amount'),
                    'total_paid'     => $allCommissions->where('status', 'Paid')->sum('commission_amount'),
                    'total_payable'  => $allCommissions->where('status', 'Payable')->sum('commission_amount'),
                    'total_pending'  => $allCommissions->whereIn('status', ['Generated','Pending','Calculated'])->sum('commission_amount'),
                    'total_records'  => $allCommissions->count(),
                ],
                'partner_breakdown' => $partnerBreakdown,
                'records'           => $formatted,
                'pagination'        => [
                    'current_page' => $records->currentPage(),
                    'last_page'    => $records->lastPage(),
                    'total'        => $records->total(),
                ],
                'filters'           => compact('status', 'month', 'year', 'partnerId'),
            ]);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function summary(Partner $partner): JsonResponse
    {
        try {
            $data = CommissionService::getSummary($partner);
            return $this->success($data);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function storeRule(Request $request, Partner $partner): JsonResponse
    {
        $data = $request->validate([
            'rule_name'      => 'required|string|max:255',
            'service'        => 'nullable|string|max:100',
            'commission_type'=> 'required|string|in:' . implode(',', \App\Models\Commission\CommissionRule::TYPES),
            'rate'           => 'nullable|numeric|min:0|max:100',
            'fixed_amount'   => 'nullable|numeric|min:0',
            'target'         => 'nullable|numeric|min:0',
            'maximum_limit'  => 'nullable|numeric|min:0',
            'effective_date' => 'nullable|date',
            'expiry_date'    => 'nullable|date',
            'status'         => 'nullable|string|in:Active,Inactive,Expired',
        ]);

        try {
            $rule = CommissionService::createRule($partner, $data);
            return $this->success($rule, 'Commission rule created.', 201);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function updateRule(Request $request, CommissionRule $rule): JsonResponse
    {
        $data = $request->validate([
            'rule_name'      => 'sometimes|string|max:255',
            'service'        => 'nullable|string|max:100',
            'commission_type'=> 'sometimes|string|in:' . implode(',', \App\Models\Commission\CommissionRule::TYPES),
            'rate'           => 'nullable|numeric|min:0|max:100',
            'fixed_amount'   => 'nullable|numeric|min:0',
            'target'         => 'nullable|numeric|min:0',
            'maximum_limit'  => 'nullable|numeric|min:0',
            'effective_date' => 'nullable|date',
            'expiry_date'    => 'nullable|date',
            'status'         => 'nullable|string|in:Active,Inactive,Expired',
        ]);

        try {
            $rule = CommissionService::updateRule($rule, $data);
            return $this->success($rule, 'Commission rule updated.');
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function deactivateRule(CommissionRule $rule): JsonResponse
    {
        try {
            CommissionService::deactivateRule($rule);
            return $this->success(null, 'Commission rule deactivated.');
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function storeCommission(Request $request, Partner $partner): JsonResponse
    {
        $data = $request->validate([
            'rule_id'          => 'nullable|exists:partner_commission_rules,id',
            'source_reference' => 'nullable|string|max:100',
            'source_amount'    => 'required|numeric|min:0',
            'commission_amount'=> 'nullable|numeric|min:0',
            'period_month'     => 'required|integer|min:1|max:12',
            'period_year'      => 'required|integer|min:2000',
            'remarks'          => 'nullable|string',
        ]);

        try {
            $commission = CommissionService::createManual($partner, $data);
            return $this->success(
                $commission->load('rule'),
                'Commission record created.',
                201
            );
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }


    public function approve(Request $request, PartnerCommission $commission): JsonResponse
    {
        $data = $request->validate(['remarks' => 'nullable|string']);

        try {
            $result = CommissionService::approve(
                $commission,
                $request->user(),
                $data['remarks'] ?? ''
            );
            return $this->success($result, 'Commission approved and marked Payable.');
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function reject(Request $request, PartnerCommission $commission): JsonResponse
    {
        $data = $request->validate(['reason' => 'required|string']);

        try {
            $result = CommissionService::reject($commission, $data['reason']);
            return $this->success($result, 'Commission rejected.');
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function pay(Request $request, PartnerCommission $commission): JsonResponse
    {
        $data = $request->validate([
            'payment_date'     => 'nullable|date',
            'amount'           => 'nullable|numeric|min:0',
            'payment_method'   => 'nullable|string|in:Bank Transfer,Cheque,Cash,Mobile Banking,Other',
            'reference_number' => 'nullable|string|max:100',
        ]);

        try {
            $payment = CommissionService::pay($commission, $data, $request->user());
            return $this->success($payment, 'Commission payment recorded. Status → Paid.');
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function reverse(Request $request, PartnerCommission $commission): JsonResponse
    {
        $data = $request->validate(['reason' => 'required|string']);

        try {
            $adjustment = CommissionService::reverse($commission, $data['reason'], $request->user());
            return $this->success($adjustment, 'Commission reversed.');
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
