<?php

namespace App\Models\Partner;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerProfile extends Model
{
    protected $fillable = [
        'partner_id',
        'business_type',
        'business_category',
        'operating_area',
        'contract_type',
        'contract_start_date',
        'contract_end_date',
        'payment_terms',
        'credit_limit',
        'credit_days',
        'security_deposit',
        'billing_cycle',
        'pricing_model',
        'discount_policy',
        'commission_model',
        'notes',
    ];

    protected $casts = [
        'contract_start_date' => 'date',
        'contract_end_date'   => 'date',
        'credit_limit'        => 'decimal:2',
        'credit_days'         => 'integer',
        'security_deposit'    => 'decimal:2',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
