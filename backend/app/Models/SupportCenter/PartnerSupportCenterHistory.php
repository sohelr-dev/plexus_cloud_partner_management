<?php

namespace App\Models\SupportCenter;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerSupportCenterHistory extends Model
{
    public $timestamps = false;

    protected $table = 'partner_support_center_history';

    protected $fillable = [
        'support_center_id',
        'event_type',          // Created/Opened/Manager Changed/Staff Changed/Location Changed/Coverage Changed/Equipment Added/Equipment Removed/Cost Changed/Suspended/Closed
        'remarks',
        'performed_by',
        'event_date',
    ];

    protected $casts = [
        'event_date' => 'datetime',
    ];

    public function supportCenter(): BelongsTo
    {
        return $this->belongsTo(PartnerSupportCenter::class, 'support_center_id');
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
