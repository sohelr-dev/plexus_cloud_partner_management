<?php

namespace App\Models\Equipment;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerEndDevice extends Model
{
    use SoftDeletes;

    protected $table = 'partner_end_devices';

    protected $fillable = [
        'partner_id',
        'device_type',         // MAC Address/Router/ONU/ONT/CPE/Device ID/Serial Number/Other
        'identifier',          // MAC / Serial / Device ID
        'customer_id',
        'package_id',
        'status',              // Active/Offline/Faulty/Replaced/Suspended/Retired
        'activation_date',
        'deactivation_date',
    ];

    protected $casts = [
        'activation_date'   => 'date:Y-m-d',
        'deactivation_date' => 'date:Y-m-d',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(PartnerDeviceHistory::class, 'device_id');
    }
}
