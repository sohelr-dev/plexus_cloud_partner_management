<?php

namespace App\Models\Intelligence;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerInsight extends Model
{
    protected $table = 'partner_insights';

    protected $fillable = [
        'partner_id',
        'type',
        'category',
        'content',
        'action',
        'data_points',
        'priority',
        'is_active',
        'generated_at',
    ];

    protected $casts = [
        'data_points'  => 'array',
        'is_active'    => 'boolean',
        'generated_at' => 'datetime',
    ];

    public const TYPES = ['insight', 'recommendation'];

    public const RECOMMENDATIONS = [
        'Bandwidth Upgrade',
        'Bandwidth Downgrade',
        'Credit Limit Review',
        'Payment Follow-up',
        'Commission Review',
        'Marketing Campaign',
        'Package Migration',
        'Equipment Replacement',
        'Support Center Review',
        'Contract Renewal',
        'Partner Risk Review',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
