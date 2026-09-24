<?php

namespace App\Models\Partner;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PartnerInsight — generated insights for a partner (or global when partner_id null).
 */
class PartnerInsight extends Model
{
    protected $fillable = [
        'partner_id',
        'insight_type',
        'insight_text',
        'insight_data',
        'severity',
        'generated_at',
        'is_read',
    ];

    protected $casts = [
        'insight_data' => 'array',
        'generated_at' => 'datetime',
        'is_read' => 'boolean',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
