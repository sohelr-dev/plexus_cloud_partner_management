<?php

namespace App\Models\SupportCenter;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerSupportCenterEquipment extends Model
{
    protected $table = 'partner_support_center_equipment';

    protected $fillable = [
        'support_center_id',
        'equipment_id',        // optional link to partner_equipment
        'equipment_type',      // Router/ONU/Switch/Computer/Printer/WiFi AP/UPS/CCTV/Network Equipment/Office Equipment
        'quantity',
        'status',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function supportCenter(): BelongsTo
    {
        return $this->belongsTo(PartnerSupportCenter::class, 'support_center_id');
    }
}
