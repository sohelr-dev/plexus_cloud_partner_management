<?php

namespace App\Models\Partner;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerRiskIndicator extends Model
{
    protected $fillable = [
        'partner_id',
        'risk_category',
        'risk_type',
        'risk_level',
        'description',
        'detected_at',
        'resolved_at',
        'status',
    ];

    protected $casts = [
        'detected_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
