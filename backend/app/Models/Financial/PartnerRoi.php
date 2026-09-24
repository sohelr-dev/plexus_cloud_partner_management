<?php

namespace App\Models\Financial;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PartnerRoi model — tracks ROI per investment category.
 */
class PartnerRoi extends Model
{
    protected $table = 'partner_rois';

    protected $fillable = [
        'partner_id',
        'investment_category',
        'investment_amount',
        'net_return_amount',
        'roi_percent',
        'payback_period_months',
        'snapshot_date',
        'remarks',
    ];

    protected $casts = [
        'investment_amount'     => 'decimal:2',
        'net_return_amount'     => 'decimal:2',
        'roi_percent'           => 'decimal:2',
        'payback_period_months' => 'decimal:2',
        'snapshot_date'         => 'date',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
