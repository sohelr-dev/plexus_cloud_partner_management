<?php

namespace App\Models\Financial;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PartnerProfitLoss — aggregated financial snapshot (P&L).
 */
class PartnerProfitLoss extends Model
{
    protected $fillable = [
        'partner_id',
        'period_type',
        'period_key',
        'total_revenue',
        'direct_cost',
        'gross_profit',
        'operating_cost',
        'commission_cost',
        'support_center_cost',
        'net_profit',
        'profit_margin_percent',
        'total_invoiced',
        'total_paid',
        'outstanding_balance',
        'calculated_at',
    ];

    protected $casts = [
        'total_revenue'         => 'decimal:2',
        'direct_cost'           => 'decimal:2',
        'gross_profit'          => 'decimal:2',
        'operating_cost'        => 'decimal:2',
        'commission_cost'       => 'decimal:2',
        'support_center_cost'   => 'decimal:2',
        'net_profit'            => 'decimal:2',
        'profit_margin_percent' => 'decimal:2',
        'total_invoiced'        => 'decimal:2',
        'total_paid'            => 'decimal:2',
        'outstanding_balance'   => 'decimal:2',
        'calculated_at'         => 'datetime',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
