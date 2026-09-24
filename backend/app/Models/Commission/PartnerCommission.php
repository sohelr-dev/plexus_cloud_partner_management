<?php

namespace App\Models\Commission;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerCommission extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'partner_commissions';

    protected $fillable = [
        'partner_id',
        'rule_id',
        'source_reference',
        'source_amount',
        'commission_amount',
        'period_month',
        'period_year',
        'status',
        'generated_at',
        'approved_at',
        'paid_at',
        'approved_by',
        'remarks',
    ];

    protected $casts = [
        'source_amount'     => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'generated_at'      => 'datetime',
        'approved_at'       => 'datetime',
        'paid_at'           => 'datetime',
    ];

    // Lifecycle statuses 
    const STATUSES = [
        'Generated',
        'Pending',
        'Calculated',
        'Approved',
        'Payable',
        'Paid',
        'Rejected',
        'Cancelled',
        'Reversed',
    ];

    // Status badge color map
    const STATUS_COLORS = [
        'Generated'  => 'secondary',
        'Pending'    => 'warning',
        'Calculated' => 'info',
        'Approved'   => 'primary',
        'Payable'    => 'success',
        'Paid'       => 'success',
        'Rejected'   => 'danger',
        'Cancelled'  => 'dark',
        'Reversed'   => 'danger',
    ];

    // Relationships
    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function rule()
    {
        return $this->belongsTo(CommissionRule::class, 'rule_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function payments()
    {
        return $this->hasMany(CommissionPayment::class, 'commission_id');
    }

    public function adjustments()
    {
        return $this->hasMany(CommissionAdjustment::class, 'commission_id');
    }
}
