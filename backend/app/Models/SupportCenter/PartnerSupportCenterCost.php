<?php

namespace App\Models\SupportCenter;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerSupportCenterCost extends Model
{
    use SoftDeletes;

    protected $table = 'partner_support_center_costs';

    protected $fillable = [
        'support_center_id',
        'cost_date',
        'cost_type',           // Rent/Electricity/Internet/Staff Cost/Equipment Cost/Maintenance/Transportation/Marketing/Other
        'amount',
        'description',
    ];

    protected $casts = [
        'cost_date' => 'date',
        'amount'    => 'decimal:2',
    ];

    public function supportCenter(): BelongsTo
    {
        return $this->belongsTo(PartnerSupportCenter::class, 'support_center_id');
    }
}
