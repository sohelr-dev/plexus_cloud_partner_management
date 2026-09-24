<?php

namespace App\Models\Bandwidth;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerBandwidthHistory extends Model
{
    protected $table = 'partner_bandwidth_history';

    protected $fillable = [
        'partner_id',
        'allocation_id',
        'change_id',
        'event_type',       // Allocated/Upgraded/Downgraded/Suspended/Resumed/Expired
        'previous_value',
        'new_value',
        'changed_by',
        'changed_at',
        'remarks',
    ];

    protected $casts = [
        'previous_value' => 'decimal:2',
        'new_value'      => 'decimal:2',
        'changed_at'     => 'datetime',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(PartnerBandwidthAllocation::class, 'allocation_id');
    }

    public function change(): BelongsTo
    {
        return $this->belongsTo(PartnerBandwidthChange::class, 'change_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
