<?php

namespace App\Models\Bandwidth;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerBandwidthChange extends Model
{
    use SoftDeletes;

    protected $table = 'partner_bandwidth_changes';

    protected $fillable = [
        'partner_id',
        'allocation_id',
        'change_type',          // Upgrade/Downgrade/Temporary/Emergency/Administrative
        'previous_mbps',
        'new_mbps',
        'difference_mbps',
        'revenue_impact',
        'cost_impact',
        'profit_impact',
        'reason',
        'effective_date',
        'requester_id',
        'approver_id',
        'supporting_document',
        'status',               // Requested/Capacity Check/Commercial Review/Approved/Rejected/Completed
    ];

    protected $casts = [
        'previous_mbps'   => 'decimal:2',
        'new_mbps'        => 'decimal:2',
        'difference_mbps' => 'decimal:2',
        'revenue_impact'  => 'decimal:2',
        'cost_impact'     => 'decimal:2',
        'profit_impact'   => 'decimal:2',
        'effective_date'  => 'date',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(PartnerBandwidthAllocation::class, 'allocation_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(PartnerBandwidthApproval::class, 'change_id');
    }
}
