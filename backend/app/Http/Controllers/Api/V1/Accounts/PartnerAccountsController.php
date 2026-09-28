<?php

namespace App\Http\Controllers\Api\V1\Accounts;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Commission\PartnerCommission;
use App\Models\Financial\PartnerPayment;
use App\Models\Financial\PartnerRevenue;
use App\Models\Partner\Partner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PartnerAccountsController extends ApiController
{

    public function outstanding(Request $request): JsonResponse
    {
        $search    = trim((string) $request->query('search', ''));
        $status    = $request->query('status');          // Active, Suspended …
        $agingBand = $request->query('aging');           // current | 30 | 60 | 90
        $perPage   = min((int) $request->query('per_page', 25), 100);

        $today = Carbon::today();


        $partners = Partner::query()
            ->select([
                'id', 'partner_id', 'partner_name', 'partner_code',
                'status', 'account_manager_id',
            ])
            ->with(['accountManager:id,name', 'profile:partner_id,credit_limit,payment_terms'])
            ->when($search, fn($q) => $q->where(function ($w) use ($search) {
                $w->where('partner_name', 'like', "%{$search}%")
                  ->orWhere('partner_id',   'like', "%{$search}%")
                  ->orWhere('partner_code', 'like', "%{$search}%");
            }))
            ->when($status, fn($q) => $q->where('status', $status))
            ->get();

        $rows = [];

        foreach ($partners as $partner) {
            $totalInvoiced = (float) PartnerRevenue::where('partner_id', $partner->id)->sum('amount');
            $totalPaid     = (float) PartnerPayment::where('partner_id', $partner->id)
                                ->where('status', 'Completed')->sum('amount');
            $outstanding   = max(0, $totalInvoiced - $totalPaid);

            if ($outstanding <= 0) {
                continue; // skip fully-paid partners
            }


            $revenues = PartnerRevenue::where('partner_id', $partner->id)
                ->select('revenue_date', 'amount', 'source_reference')
                ->orderBy('revenue_date')
                ->get();

            $ageCurrent = 0; // 0–30 days old
            $age30      = 0; // 31–60 days old
            $age60      = 0; // 61–90 days old
            $age90      = 0; // 90+ days old

            $lastPaymentDate = PartnerPayment::where('partner_id', $partner->id)
                ->where('status', 'Completed')
                ->max('payment_date');

            $remainingOutstanding = $outstanding;


            foreach ($revenues as $rev) {
                if ($remainingOutstanding <= 0) break;
                $amt  = min((float) $rev->amount, $remainingOutstanding);
                $days = (int) Carbon::parse($rev->revenue_date)->diffInDays($today, false);

                if ($days <= 30)       $ageCurrent += $amt;
                elseif ($days <= 60)   $age30      += $amt;
                elseif ($days <= 90)   $age60      += $amt;
                else                   $age90      += $amt;

                $remainingOutstanding -= $amt;
            }

            $creditLimit      = (float) ($partner->profile->credit_limit ?? 0);
            $creditUtil       = $creditLimit > 0 ? round(($outstanding / $creditLimit) * 100, 1) : null;
            $isCreditExceeded = $creditLimit > 0 && $outstanding > $creditLimit;

            $row = [
                'partner_id'          => $partner->partner_id,
                'partner_db_id'       => $partner->id,
                'partner_name'        => $partner->partner_name,
                'partner_code'        => $partner->partner_code,
                'status'              => $partner->status,
                'account_manager'     => $partner->accountManager?->name,
                'payment_terms'       => $partner->profile?->payment_terms,
                'total_invoiced'      => round($totalInvoiced, 2),
                'total_paid'          => round($totalPaid, 2),
                'outstanding'         => round($outstanding, 2),
                'credit_limit'        => $creditLimit,
                'credit_utilization'  => $creditUtil,
                'credit_exceeded'     => $isCreditExceeded,
                'last_payment_date'   => $lastPaymentDate,
                'aging' => [
                    'current' => round($ageCurrent, 2),   // 0–30 days
                    'days_30' => round($age30, 2),         // 31–60 days
                    'days_60' => round($age60, 2),         // 61–90 days
                    'days_90' => round($age90, 2),         // 90+ days
                ],
            ];

            // Filter by aging band if requested
            if ($agingBand) {
                $bandMap = ['current' => 'current', '30' => 'days_30', '60' => 'days_60', '90' => 'days_90'];
                $key = $bandMap[$agingBand] ?? null;
                if ($key && $row['aging'][$key] <= 0) continue;
            }

            $rows[] = $row;
        }

        // Sort by outstanding descending
        usort($rows, fn($a, $b) => $b['outstanding'] <=> $a['outstanding']);


        $totalOutstanding = array_sum(array_column($rows, 'outstanding'));
        $summary = [
            'total_partners_with_outstanding' => count($rows),
            'total_outstanding'               => round($totalOutstanding, 2),
            'aging_current'                   => round(array_sum(array_column(array_column($rows, 'aging'), 'current')), 2),
            'aging_30'                        => round(array_sum(array_column(array_column($rows, 'aging'), 'days_30')), 2),
            'aging_60'                        => round(array_sum(array_column(array_column($rows, 'aging'), 'days_60')), 2),
            'aging_90'                        => round(array_sum(array_column(array_column($rows, 'aging'), 'days_90')), 2),
            'credit_exceeded_count'           => count(array_filter($rows, fn($r) => $r['credit_exceeded'])),
        ];

        // Manual pagination
        $page    = max(1, (int) $request->query('page', 1));
        $offset  = ($page - 1) * $perPage;
        $paged   = array_slice($rows, $offset, $perPage);
        $total   = count($rows);

        return $this->success([
            'summary'     => $summary,
            'data'        => $paged,
            'meta' => [
                'current_page' => $page,
                'per_page'     => $perPage,
                'total'        => $total,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ], 'Outstanding list loaded');
    }


    public function commissions(Request $request): JsonResponse
    {
        $search    = trim((string) $request->query('search', ''));
        $status    = $request->query('status', null); // Approved | Payable (default both)
        $partnerId = $request->query('partner_id');
        $perPage   = min((int) $request->query('per_page', 25), 100);

        $query = PartnerCommission::with([
                'partner:id,partner_name,partner_id,partner_code',
                'rule:id,rule_name,commission_type',
                'approvedBy:id,name',
            ])
            ->whereIn('status', $status ? [$status] : ['Approved', 'Payable'])
            ->orderByDesc('approved_at');

        if ($partnerId) {
            $query->where('partner_id', $partnerId);
        }

        if ($search) {
            $query->whereHas('partner', fn($q) =>
                $q->where('partner_name', 'like', "%{$search}%")
                  ->orWhere('partner_id',   'like', "%{$search}%")
            );
        }

        $paginated = $query->paginate($perPage)->withQueryString();

        // Summary KPIs
        $allPayable = PartnerCommission::whereIn('status', ['Approved', 'Payable']);
        if ($partnerId) $allPayable->where('partner_id', $partnerId);
        $totalPayable = (float) $allPayable->sum('commission_amount');
        $countPayable = (int)   $allPayable->count();

        $byStatus = [];
        foreach (['Approved', 'Payable'] as $s) {
            $q = PartnerCommission::where('status', $s);
            if ($partnerId) $q->where('partner_id', $partnerId);
            $byStatus[$s] = (float) $q->sum('commission_amount');
        }

        return $this->success([
            'summary' => [
                'total_payable'     => round($totalPayable, 2),
                'total_count'       => $countPayable,
                'by_status'         => $byStatus,
            ],
            'data'   => $paginated->items(),
            'meta'   => [
                'current_page' => $paginated->currentPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Commission payable list loaded');
    }


    public function invoices(Request $request): JsonResponse
    {
        $search    = trim((string) $request->query('search', ''));
        $partnerId = $request->query('partner_id');
        $dateFrom  = $request->query('date_from');
        $dateTo    = $request->query('date_to', now()->toDateString());
        $perPage   = min((int) $request->query('per_page', 25), 100);

        // Aggregate revenue (invoices) + payments per partner
        $revenueQuery = PartnerRevenue::select(
                'partner_id',
                DB::raw('SUM(amount) as total_invoiced'),
                DB::raw('COUNT(*) as invoice_count'),
                DB::raw('MIN(revenue_date) as first_invoice'),
                DB::raw('MAX(revenue_date) as last_invoice')
            )
            ->groupBy('partner_id');

        if ($dateFrom) $revenueQuery->where('revenue_date', '>=', $dateFrom);
        if ($dateTo)   $revenueQuery->where('revenue_date', '<=', $dateTo);
        if ($partnerId) $revenueQuery->where('partner_id', $partnerId);

        $revenueByPartner = $revenueQuery->get()->keyBy('partner_id');

        $paymentQuery = PartnerPayment::select(
                'partner_id',
                DB::raw('SUM(amount) as total_paid'),
                DB::raw('MAX(payment_date) as last_payment_date')
            )
            ->where('status', 'Completed')
            ->groupBy('partner_id');

        if ($dateFrom) $paymentQuery->where('payment_date', '>=', $dateFrom);
        if ($dateTo)   $paymentQuery->where('payment_date', '<=', $dateTo);
        if ($partnerId) $paymentQuery->where('partner_id', $partnerId);

        $paymentByPartner = $paymentQuery->get()->keyBy('partner_id');

        $partnerIds = $revenueByPartner->keys()->merge($paymentByPartner->keys())->unique();

        $partners = Partner::whereIn('id', $partnerIds)
            ->select('id', 'partner_id', 'partner_name', 'partner_code', 'status')
            ->with(['profile:partner_id,credit_limit,payment_terms'])
            ->when($search, fn($q) => $q->where(fn($w) =>
                $w->where('partner_name', 'like', "%{$search}%")
                  ->orWhere('partner_id',   'like', "%{$search}%")
            ))
            ->get()
            ->keyBy('id');

        $rows = [];
        foreach ($partners as $id => $partner) {
            $rev     = $revenueByPartner->get($id);
            $pay     = $paymentByPartner->get($id);

            $invoiced    = (float) ($rev->total_invoiced ?? 0);
            $paid        = (float) ($pay->total_paid     ?? 0);
            $outstanding = max(0, $invoiced - $paid);

            $rows[] = [
                'partner_id'        => $partner->partner_id,
                'partner_db_id'     => $partner->id,
                'partner_name'      => $partner->partner_name,
                'partner_code'      => $partner->partner_code,
                'status'            => $partner->status,
                'payment_terms'     => $partner->profile?->payment_terms,
                'credit_limit'      => (float) ($partner->profile?->credit_limit ?? 0),
                'invoice_count'     => (int) ($rev->invoice_count ?? 0),
                'total_invoiced'    => round($invoiced, 2),
                'total_paid'        => round($paid, 2),
                'outstanding'       => round($outstanding, 2),
                'first_invoice'     => $rev->first_invoice ?? null,
                'last_invoice'      => $rev->last_invoice  ?? null,
                'last_payment_date' => $pay->last_payment_date ?? null,
            ];
        }

        // Sort by outstanding desc
        usort($rows, fn($a, $b) => $b['outstanding'] <=> $a['outstanding']);

        $summary = [
            'total_invoiced'    => round(array_sum(array_column($rows, 'total_invoiced')), 2),
            'total_paid'        => round(array_sum(array_column($rows, 'total_paid')), 2),
            'total_outstanding' => round(array_sum(array_column($rows, 'outstanding')), 2),
            'partner_count'     => count($rows),
        ];

        // Manual pagination
        $page  = max(1, (int) $request->query('page', 1));
        $offset = ($page - 1) * $perPage;
        $paged  = array_slice($rows, $offset, $perPage);
        $total  = count($rows);

        return $this->success([
            'summary' => $summary,
            'data'    => $paged,
            'meta'    => [
                'current_page' => $page,
                'per_page'     => $perPage,
                'total'        => $total,
                'last_page'    => (int) ceil($total / $perPage),
                'date_from'    => $dateFrom,
                'date_to'      => $dateTo,
            ],
        ], 'Invoice summary loaded');
    }


    public function creditOverview(Request $request): JsonResponse
    {
        $search  = trim((string) $request->query('search', ''));
        $status  = $request->query('status');
        $perPage = min((int) $request->query('per_page', 25), 100);

        $partners = Partner::query()
            ->select(['id', 'partner_id', 'partner_name', 'partner_code', 'status', 'account_manager_id'])
            ->with(['accountManager:id,name', 'profile:partner_id,credit_limit,payment_terms'])
            ->whereHas('profile', fn($q) => $q->where('credit_limit', '>', 0))
            ->when($search, fn($q) => $q->where(fn($w) =>
                $w->where('partner_name', 'like', "%{$search}%")
                  ->orWhere('partner_id',   'like', "%{$search}%")
            ))
            ->when($status, fn($q) => $q->where('status', $status))
            ->get();

        $rows = [];
        foreach ($partners as $partner) {
            $totalInvoiced = (float) PartnerRevenue::where('partner_id', $partner->id)->sum('amount');
            $totalPaid     = (float) PartnerPayment::where('partner_id', $partner->id)
                                ->where('status', 'Completed')->sum('amount');
            $outstanding   = max(0, $totalInvoiced - $totalPaid);
            $creditLimit   = (float) ($partner->profile?->credit_limit ?? 0);
            $available     = max(0, $creditLimit - $outstanding);
            $utilizationPct = $creditLimit > 0 ? round(($outstanding / $creditLimit) * 100, 1) : 0;

            $rows[] = [
                'partner_id'         => $partner->partner_id,
                'partner_db_id'      => $partner->id,
                'partner_name'       => $partner->partner_name,
                'partner_code'       => $partner->partner_code,
                'status'             => $partner->status,
                'account_manager'    => $partner->accountManager?->name,
                'payment_terms'      => $partner->profile?->payment_terms,
                'credit_limit'       => $creditLimit,
                'outstanding'        => round($outstanding, 2),
                'available_credit'   => round($available, 2),
                'utilization_pct'    => $utilizationPct,
                'risk_level'         => match(true) {
                    $utilizationPct >= 100 => 'exceeded',
                    $utilizationPct >= 80  => 'high',
                    $utilizationPct >= 50  => 'medium',
                    default                => 'low',
                },
            ];
        }

        usort($rows, fn($a, $b) => $b['utilization_pct'] <=> $a['utilization_pct']);

        $summary = [
            'total_credit_limit' => round(array_sum(array_column($rows, 'credit_limit')), 2),
            'total_outstanding'  => round(array_sum(array_column($rows, 'outstanding')), 2),
            'total_available'    => round(array_sum(array_column($rows, 'available_credit')), 2),
            'exceeded_count'     => count(array_filter($rows, fn($r) => $r['risk_level'] === 'exceeded')),
            'high_risk_count'    => count(array_filter($rows, fn($r) => $r['risk_level'] === 'high')),
        ];

        $page   = max(1, (int) $request->query('page', 1));
        $offset = ($page - 1) * $perPage;
        $paged  = array_slice($rows, $offset, $perPage);
        $total  = count($rows);

        return $this->success([
            'summary' => $summary,
            'data'    => $paged,
            'meta'    => [
                'current_page' => $page,
                'per_page'     => $perPage,
                'total'        => $total,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ], 'Credit overview loaded');
    }

    public function recordPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'partner_id'       => ['required', 'exists:partners,id'],
            'payment_date'     => ['required', 'date'],
            'payment_method'   => ['required', 'string', 'in:Cash,Bank Transfer,Cheque,Online,Adjustment'],
            'amount'           => ['required', 'numeric', 'gt:0'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'remarks'          => ['nullable', 'string', 'max:500'],
        ]);

        $partner = Partner::findOrFail($validated['partner_id']);
        if (in_array($partner->status, ['Draft', 'Pending Approval', 'Rejected'])) {
            return response()->json(['message' => 'Financial transactions are not allowed for this partner status.'], 403);
        }

        $validated['created_by'] = $request->user()?->id;
        $validated['status']     = 'Completed';

        $payment = \App\Models\Financial\PartnerPayment::create($validated);

        // Recalculate P&L
        $partner = Partner::find($validated['partner_id']);
        if ($partner) {
            \App\Services\FinancialCalculationService::calculatePnL($partner);
        }

        \App\Services\AuditLogService::log(
            action: 'accounts.payment_recorded',
            entity: $payment,
            newValues: $payment->toArray(),
            reason: "Accounts: Payment of ৳{$payment->amount} via {$payment->payment_method} for partner #{$validated['partner_id']}"
        );

        \App\Services\NotificationService::notifyFinancialAlert(
            title: 'Payment Recorded',
            message: "৳" . number_format((float) $payment->amount, 0) . " payment recorded for partner.",
            partnerId: $validated['partner_id'],
            severity: 'info'
        );

        return $this->success(
            $payment->load(['partner:id,partner_name', 'creator:id,name']),
            'Payment recorded successfully.',
            201
        );
    }
}
