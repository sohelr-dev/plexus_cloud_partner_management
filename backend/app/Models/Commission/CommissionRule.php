<?php

namespace App\Models\Commission;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CommissionRule extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'partner_commission_rules';

    protected $fillable = [
        'partner_id',
        'rule_name',
        'service',
        'package_id',
        'commission_type',
        'rate',
        'fixed_amount',
        'target',
        'maximum_limit',
        'effective_date',
        'expiry_date',
        'status',
    ];

    protected $casts = [
        'rate'          => 'decimal:2',
        'fixed_amount'  => 'decimal:2',
        'target'        => 'decimal:2',
        'maximum_limit' => 'decimal:2',
        'effective_date' => 'date:Y-m-d',
        'expiry_date'    => 'date:Y-m-d',
    ];

    // Commission type constants 
    const TYPES = [
        'Percentage',
        'Fixed Amount',
        'Per Customer',
        'Per Activation',
        'Per Renewal',
        'Per Package',
        'Revenue Based',
        'Bandwidth Based',
        'Custom',
    ];

    const STATUSES = ['Active', 'Inactive', 'Expired'];

    // Relationships
    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function commissions()
    {
        return $this->hasMany(PartnerCommission::class, 'rule_id');
    }
}
