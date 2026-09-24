<?php

namespace App\Models\Equipment;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerEquipmentHistory extends Model
{
    protected $table = 'partner_equipment_history';

    protected $fillable = [
        'equipment_id',
        'event_type',       // Purchased/Assigned/Installed/Maintenance/Replaced/Returned/Retired
        'event_date',
        'performed_by',
        'remarks',
    ];

    protected $casts = [
        'event_date' => 'date',
    ];

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(PartnerEquipment::class, 'equipment_id');
    }

    public function performedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
