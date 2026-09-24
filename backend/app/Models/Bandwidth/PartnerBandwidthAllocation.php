<?php

namespace App\Models\Bandwidth;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerBandwidthAllocation extends Model
{
    use SoftDeletes;

    protected $table = 'partner_bandwidth_allocations';

    protected $fillable = [
        'partner_id',
        'service',               // Internet/GGC/FNA/BDIX/Other
        'allocated_mbps',
        'used_mbps',
        'available_mbps',
        'utilization_percent',
        'ratio',                 // e.g. 1:8
        'price',
        'cost',
        'effective_date',
        'expiry_date',
        'status',                // Active/Expired/Suspended/Pending
        'work_order_id',
        'approval_id',
    ];

    protected $casts = [
        'allocated_mbps'      => 'decimal:2',
        'used_mbps'           => 'decimal:2',
        'available_mbps'      => 'decimal:2',
        'utilization_percent' => 'decimal:2',
        'price'               => 'decimal:2',
        'cost'                => 'decimal:2',
        'effective_date'      => 'date:Y-m-d',
        'expiry_date'         => 'date:Y-m-d',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function changes(): HasMany
    {
        return $this->hasMany(PartnerBandwidthChange::class, 'allocation_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(PartnerBandwidthHistory::class, 'allocation_id');
    }
}
