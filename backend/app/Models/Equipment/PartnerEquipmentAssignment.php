<?php

namespace App\Models\Equipment;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerEquipmentAssignment extends Model
{
    protected $table = 'partner_equipment_assignments';

    protected $fillable = [
        'equipment_id',
        'partner_id',
        'customer_id',
        'assigned_date',
        'returned_date',
        'assigned_by',
        'status',             // Active/Returned/Transferred
        'remarks',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'returned_date' => 'date',
    ];

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(PartnerEquipment::class, 'equipment_id');
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function assignedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
