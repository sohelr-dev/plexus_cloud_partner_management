<?php

namespace App\Models\Equipment;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerDeviceHistory extends Model
{
    protected $table = 'partner_device_history';

    protected $fillable = [
        'device_id',
        'event_type',       // Added/Assigned/Activated/Suspended/Replaced/Returned/Retired
        'event_date',
        'performed_by',
        'remarks',
    ];

    protected $casts = [
        'event_date' => 'datetime',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(PartnerEndDevice::class, 'device_id');
    }

    public function performedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
