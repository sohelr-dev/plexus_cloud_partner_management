<?php

namespace App\Models\SupportCenter;

use App\Models\Lookup\Zone;
use App\Models\Lookup\Territory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerSupportCenterService extends Model
{
    protected $table = 'partner_support_center_services';

    protected $fillable = [
        'support_center_id',
        'service_area',
        'zone_id',
        'territory_id',
        'coverage_area',
        'supported_services',
        'customer_capacity',
    ];

    protected $casts = [
        'customer_capacity' => 'integer',
    ];

    public function supportCenter(): BelongsTo
    {
        return $this->belongsTo(PartnerSupportCenter::class, 'support_center_id');
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function territory(): BelongsTo
    {
        return $this->belongsTo(Territory::class);
    }
}
