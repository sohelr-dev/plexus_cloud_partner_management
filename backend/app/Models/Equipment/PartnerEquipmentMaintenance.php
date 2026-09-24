<?php

namespace App\Models\Equipment;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerEquipmentMaintenance extends Model
{
    protected $table = 'partner_equipment_maintenance';

    protected $fillable = [
        'equipment_id',
        'maintenance_date',
        'maintenance_type',    // Preventive/Corrective/Emergency
        'cost',
        'description',
        'performed_by',
        'next_due_date',
        'status',              // Scheduled/In Progress/Completed
    ];

    protected $casts = [
        'cost'             => 'decimal:2',
        'maintenance_date' => 'date',
        'next_due_date'    => 'date',
    ];

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(PartnerEquipment::class, 'equipment_id');
    }
}
