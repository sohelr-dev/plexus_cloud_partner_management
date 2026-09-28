<?php

namespace App\Models\Financial;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerFinancialSnapshot extends Model
{
    use HasFactory;

    protected $table = 'partner_financial_snapshots';

    protected $fillable = [
        'partner_id',
        'snapshot_date',
        'total_invoiced',
        'total_paid',
        'outstanding',
        'overdue',
        'credit_limit',
        'credit_utilization',
        'last_payment_date',
        'next_due_date',
        'avg_payment_delay',
    ];

    protected $casts = [
        'snapshot_date'      => 'date',
        'last_payment_date'  => 'date',
        'next_due_date'      => 'date',
        'total_invoiced'     => 'decimal:2',
        'total_paid'         => 'decimal:2',
        'outstanding'        => 'decimal:2',
        'overdue'            => 'decimal:2',
        'credit_limit'       => 'decimal:2',
        'credit_utilization' => 'decimal:2',
        'avg_payment_delay'  => 'integer',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
