<?php

namespace App\Models\Partner;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class PartnerTimelineEvent extends Model
{
    protected $table = 'partner_timeline_events';

    public const MODULES = [
        'Business',
        'Marketing',
        'Financial',
        'Bandwidth',
        'Equipment',
        'Users',
        'Commission',
        'Support Center',
        'Documents',
        'Approval',
        'System',
    ];

    protected $fillable = [
        'partner_id',
        'event_type',
        'module',
        'title',
        'description',
        'severity',
        'reference_type',
        'reference_id',
        'reference_label',
        'meta',
        'performed_by',
        'event_date',
    ];

    protected $casts = [
        'meta'       => 'array',
        'event_date' => 'datetime',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
