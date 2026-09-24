<?php

namespace App\Models\Equipment;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PartnerEquipment extends Model
{
    use SoftDeletes;

    protected $table = 'partner_equipment';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->equipment_id)) {
                $model->equipment_id = 'EQ-' . date('Ymd') . '-' . strtoupper(Str::random(4));
            }
        });
    }

    protected $fillable = [
        'equipment_id',
        'asset_id',
        'serial_number',
        'mac_address',
        'equipment_type',      // Router/ONU/ONT/OLT/Switch/CPE/Access Point
        'manufacturer',
        'model',
        'vendor',
        'purchase_date',
        'purchase_cost',
        'installation_date',
        'location',
        'partner_id',
        'customer_id',
        'ownership',           // Company Owned/Partner Owned/Customer Owned/Leased/Rented
        'warranty_start',
        'warranty_end',
        'status',              // Available/Assigned/Installed/Active/Faulty/Under Maintenance/Replaced/Returned/Lost/Retired
    ];

    protected $casts = [
        'purchase_cost'     => 'decimal:2',
        'purchase_date'     => 'date:Y-m-d',
        'installation_date' => 'date:Y-m-d',
        'warranty_start'    => 'date:Y-m-d',
        'warranty_end'      => 'date:Y-m-d',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(PartnerEquipmentAssignment::class, 'equipment_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(PartnerEquipmentHistory::class, 'equipment_id');
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(PartnerEquipmentMaintenance::class, 'equipment_id');
    }
}
