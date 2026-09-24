<?php

namespace App\Models\Commission;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommissionAdjustment extends Model
{
    use HasFactory;

    protected $table = 'partner_commission_adjustments';

    protected $fillable = [
        'partner_id',
        'commission_id',
        'adjustment_type',
        'amount',
        'reason',
        'adjusted_by',
        'adjusted_at',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'adjusted_at' => 'datetime',
    ];

    const TYPES = ['Reversal', 'Correction', 'Bonus', 'Penalty'];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function commission()
    {
        return $this->belongsTo(PartnerCommission::class, 'commission_id');
    }

    public function adjustedBy()
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }
}
