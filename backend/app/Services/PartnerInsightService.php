<?php

namespace App\Services;

use App\Models\Intelligence\PartnerInsight;
use App\Models\Partner\Partner;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class PartnerInsightService
{
    public static function generate(Partner $partner): array
    {
        $partner->load([
            'revenues',
            'costs',
            'payments',
            'bandwidthAllocations',
            'customerMetrics',
            'commissions',
            'supportCenters.costs',
            'documents',
        ]);

        PartnerInsight::where('partner_id', $partner->id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $insights        = self::buildInsights($partner);
        $recommendations = self::buildRecommendations($partner);

        $all = array_merge($insights, $recommendations);

        $saved = [];
        foreach ($all as $item) {
            $saved[] = PartnerInsight::create(array_merge($item, [
                'partner_id'   => $partner->id,
                'is_active'    => true,
                'generated_at' => now(),
            ]));
        }

        return $saved;
    }

    public static function latest(Partner $partner): array
    {
        $rows = PartnerInsight::where('partner_id', $partner->id)
            ->where('is_active', true)
            ->orderByRaw("FIELD(priority, 'Critical','High','Medium','Low')")
            ->get();

        return [
            'insights'        => $rows->where('type', 'insight')->values(),
            'recommendations' => $rows->where('type', 'recommendation')->values(),
        ];
    }


    private static function buildInsights(Partner $partner): array
    {
        $insights = [];
        $now  = Carbon::now();
        $prev = $now->copy()->subMonth();

        $currentRev  = self::revenueForMonth($partner, $now);
        $previousRev = self::revenueForMonth($partner, $prev);
        $currentCost = self::costForMonth($partner, $now);

        if ($previousRev > 0) {
            $changePct = round((($currentRev - $previousRev) / $previousRev) * 100, 1);
            $direction = $changePct >= 0 ? 'increased' : 'declined';
            $absPct    = abs($changePct);

            $insights[] = [
                'type'     => 'insight',
                'category' => 'Financial',
                'content'  => "Partner revenue {$direction} by {$absPct}% compared with the previous month "
                    . "(৳" . number_format($currentRev, 0) . " vs ৳" . number_format($previousRev, 0) . ").",
                'priority'    => $absPct >= 20 ? 'High' : 'Medium',
                'data_points' => [
                    'current_revenue'  => $currentRev,
                    'previous_revenue' => $previousRev,
                    'change_pct'       => $changePct,
                ],
            ];
        }

        if ($currentRev > 0) {
            $profitMargin = round((($currentRev - $currentCost) / $currentRev) * 100, 1);
            $insights[]   = [
                'type'     => 'insight',
                'category' => 'Financial',
                'content'  => "Current profit margin is {$profitMargin}%"
                    . ($profitMargin < 10 ? ' — margin is below acceptable threshold.' : '.'),
                'priority'    => $profitMargin < 10 ? 'High' : 'Medium',
                'data_points' => [
                    'revenue'       => $currentRev,
                    'cost'          => $currentCost,
                    'profit_margin' => $profitMargin,
                ],
            ];
        }

        $commissionTotal = (float) $partner->commissions()
            ->whereYear('created_at', $now->year)
            ->whereMonth('created_at', $now->month)
            ->sum('commission_amount');

        if ($currentRev > 0 && $commissionTotal > 0) {
            $commPct    = round(($commissionTotal / $currentRev) * 100, 1);
            $insights[] = [
                'type'     => 'insight',
                'category' => 'Financial',
                'content'  => "Commission represents {$commPct}% of partner revenue this month "
                    . "(৳" . number_format($commissionTotal, 0) . ").",
                'priority'    => $commPct > 15 ? 'High' : 'Low',
                'data_points' => [
                    'revenue'          => $currentRev,
                    'commission_total' => $commissionTotal,
                    'commission_pct'   => $commPct,
                ],
            ];
        }

        $latestAlloc = $partner->bandwidthAllocations()
            ->where('status', 'Active')
            ->orderByDesc('effective_date')
            ->first();

        if ($latestAlloc && (float) $latestAlloc->allocated_mbps > 0) {
            $totalMbps = (float) $latestAlloc->allocated_mbps;
            $usedMbps = (float) ($latestAlloc->used_mbps ?? 0);
            $utilPct  = round(($usedMbps / $totalMbps) * 100, 1);

            if ($utilPct >= 85) {
                $insights[] = [
                    'type'     => 'insight',
                    'category' => 'Network',
                    'content'  => "Bandwidth utilization reached {$utilPct}%; capacity expansion should be reviewed.",
                    'priority'    => $utilPct >= 95 ? 'Critical' : 'High',
                    'data_points' => [
                        'total_mbps'  => $totalMbps,
                        'used_mbps'   => $usedMbps,
                        'utilization' => $utilPct,
                    ],
                ];
            }
        }

        // Customer growth trend insight
        $latestCustomer = $partner->customerMetrics()->orderByDesc('metric_date')->first();

        if ($latestCustomer) {
            $opening = (float) $latestCustomer->opening_customers;
            $closing = (float) $latestCustomer->closing_customers;

            if ($opening > 0) {
                $growthPct = round((($closing - $opening) / $opening) * 100, 1);

                if ($growthPct < 0) {
                    $insights[] = [
                        'type'     => 'insight',
                        'category' => 'Marketing',
                        'content'  => "Customer growth has declined by {$growthPct}% this period "
                            . "(from {$opening} to {$closing} active customers).",
                        'priority'    => abs($growthPct) >= 10 ? 'High' : 'Medium',
                        'data_points' => [
                            'opening'    => $opening,
                            'closing'    => $closing,
                            'growth_pct' => $growthPct,
                        ],
                    ];
                }
            }
        }

        // Support Center cost insight
        foreach ($partner->supportCenters as $sc) {
            $monthCost = $sc->costs()
                ->whereMonth('cost_date', $now->month)
                ->whereYear('cost_date', $now->year)
                ->sum('amount');

            if ($monthCost > 0) {
                $prevMonthCost = $sc->costs()
                    ->whereMonth('cost_date', $prev->month)
                    ->whereYear('cost_date', $prev->year)
                    ->sum('amount');

                if ($prevMonthCost > 0) {
                    $costChangePct = round((($monthCost - $prevMonthCost) / $prevMonthCost) * 100, 1);
                    if ($costChangePct >= 15) {
                        $insights[] = [
                            'type'     => 'insight',
                            'category' => 'Support Center',
                            'content'  => "Support Center '{$sc->center_name}' operating cost increased by {$costChangePct}%.",
                            'priority'    => $costChangePct >= 30 ? 'High' : 'Medium',
                            'data_points' => [
                                'center_name'     => $sc->center_name,
                                'current_cost'    => $monthCost,
                                'previous_cost'   => $prevMonthCost,
                                'change_pct'      => $costChangePct,
                            ],
                        ];
                    }
                }
            }
        }

        return $insights;
    }


    private static function buildRecommendations(Partner $partner): array
    {
        $recs = [];
        $now  = Carbon::now();

        $latestAlloc = $partner->bandwidthAllocations()
            ->where('status', 'Active')
            ->orderByDesc('effective_date')
            ->first();

        if ($latestAlloc && (float) $latestAlloc->allocated_mbps > 0) {
            $totalMbps = (float) $latestAlloc->allocated_mbps;
            $usedMbps = (float) ($latestAlloc->used_mbps ?? 0);
            $utilPct  = ($usedMbps / $totalMbps) * 100;

            if ($utilPct >= 90) {
                $recs[] = [
                    'type'     => 'recommendation',
                    'category' => 'Network',
                    'action'   => 'Bandwidth Upgrade',
                    'content'  => "Bandwidth utilization at " . round($utilPct, 1)
                        . "% — upgrade recommended to avoid service degradation.",
                    'priority'    => $utilPct >= 95 ? 'Critical' : 'High',
                    'data_points' => [
                        'utilization' => round($utilPct, 2),
                        'total_mbps'  => $totalMbps,
                    ],
                ];
            }

            // Bandwidth Downgrade recommendation
            if ($utilPct < 20) {
                $recs[] = [
                    'type'     => 'recommendation',
                    'category' => 'Network',
                    'action'   => 'Bandwidth Downgrade',
                    'content'  => "Bandwidth utilization is only " . round($utilPct, 1)
                        . "%. Downgrading bandwidth may reduce monthly costs.",
                    'priority'    => 'Low',
                    'data_points' => ['utilization' => round($utilPct, 2)],
                ];
            }
        }

        // Payment Follow-up
        $totalRevenue  = (float) $partner->revenues()->sum('amount');
        $totalPaid     = (float) $partner->payments()->sum('amount');
        $outstanding   = max(0, $totalRevenue - $totalPaid);
        $creditLimit   = (float) ($partner->credit_limit ?? 0);

        if ($outstanding > 0 && ($creditLimit <= 0 || $outstanding >= $creditLimit * 0.5)) {
            $recs[] = [
                'type'     => 'recommendation',
                'category' => 'Financial',
                'action'   => 'Payment Follow-up',
                'content'  => "Outstanding balance is ৳" . number_format($outstanding, 0)
                    . ". Payment follow-up required.",
                'priority'    => $outstanding >= $creditLimit * 0.8 ? 'High' : 'Medium',
                'data_points' => [
                    'outstanding'  => $outstanding,
                    'credit_limit' => $creditLimit,
                ],
            ];
        }

        // Credit Limit Review
        if ($creditLimit > 0 && $outstanding >= $creditLimit * 0.9) {
            $recs[] = [
                'type'     => 'recommendation',
                'category' => 'Financial',
                'action'   => 'Credit Limit Review',
                'content'  => "Outstanding at " . round(($outstanding / $creditLimit) * 100, 1)
                    . "% of credit limit. Review required.",
                'priority'    => 'High',
                'data_points' => [
                    'outstanding'      => $outstanding,
                    'credit_limit'     => $creditLimit,
                    'utilization_pct'  => round(($outstanding / $creditLimit) * 100, 2),
                ],
            ];
        }

        // Contract Renewal
        $expiringDocs = $partner->documents()
            ->whereNotNull('expiry_date')
            ->where('status', 'Active')
            ->where('expiry_date', '>=', Carbon::now())
            ->where('expiry_date', '<=', Carbon::now()->addDays(90))
            ->orderBy('expiry_date')
            ->get(['document_name', 'expiry_date']);

        foreach ($expiringDocs as $doc) {
            $daysLeft = Carbon::now()->diffInDays($doc->expiry_date, false);
            $recs[]   = [
                'type'     => 'recommendation',
                'category' => 'Contract',
                'action'   => 'Contract Renewal',
                'content'  => "'{$doc->document_name}' expires in {$daysLeft} days. Renewal should be initiated.",
                'priority'    => $daysLeft <= 30 ? 'High' : 'Medium',
                'data_points' => [
                    'document_name' => $doc->document_name,
                    'expiry_date'   => $doc->expiry_date,
                    'days_left'     => $daysLeft,
                ],
            ];
        }

        // Marketing Campaign
        $latestCustomer = $partner->customerMetrics()->orderByDesc('metric_date')->first();
        if ($latestCustomer) {
            $opening = (float) $latestCustomer->opening_customers;
            $closing = (float) $latestCustomer->closing_customers;

            if ($opening > 0 && $closing < $opening) {
                $recs[] = [
                    'type'     => 'recommendation',
                    'category' => 'Marketing',
                    'action'   => 'Marketing Campaign',
                    'content'  => "Customer base declined from {$opening} to {$closing}. A targeted marketing campaign may help retention and growth.",
                    'priority'    => 'Medium',
                    'data_points' => ['opening' => $opening, 'closing' => $closing],
                ];
            }
        }

        // Equipment Replacement
        $faultyCount = $partner->equipment()->where('status', 'Faulty')->count();
        if ($faultyCount > 0) {
            $recs[] = [
                'type'     => 'recommendation',
                'category' => 'Equipment',
                'action'   => 'Equipment Replacement',
                'content'  => "{$faultyCount} equipment unit(s) are faulty. Replacement planning is recommended.",
                'priority'    => $faultyCount >= 3 ? 'High' : 'Medium',
                'data_points' => ['faulty_count' => $faultyCount],
            ];
        }

        return $recs;
    }


    private static function revenueForMonth(Partner $partner, Carbon $month): float
    {
        return (float) $partner->revenues()
            ->whereYear('revenue_date', $month->year)
            ->whereMonth('revenue_date', $month->month)
            ->sum('amount');
    }

    private static function costForMonth(Partner $partner, Carbon $month): float
    {
        return (float) $partner->costs()
            ->whereYear('cost_date', $month->year)
            ->whereMonth('cost_date', $month->month)
            ->sum('amount');
    }
}
