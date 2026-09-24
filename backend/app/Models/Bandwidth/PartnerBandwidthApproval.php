<?php

namespace App\Models\Bandwidth;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerBandwidthApproval extends Model
{
    protected $table = 'partner_bandwidth_approvals';

    protected $fillable = [
        'change_id',
        'approver_id',
        'approval_level',
        'status',           // Pending/Approved/Rejected
        'decision',
        'reason',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function change(): BelongsTo
    {
        return $this->belongsTo(PartnerBandwidthChange::class, 'change_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
