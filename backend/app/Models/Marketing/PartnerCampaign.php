<?php

namespace App\Models\Marketing;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerCampaign extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id',
        'name',
        'type',
        'start_date',
        'end_date',
        'target_customers',
        'target_revenue',
        'actual_customers',
        'actual_revenue',
        'campaign_cost',
        'campaign_profit',
        'conversion_rate',
        'roi',
        'status',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date'      => 'date',
        'end_date'        => 'date',
        'target_revenue'  => 'decimal:2',
        'actual_revenue'  => 'decimal:2',
        'campaign_cost'   => 'decimal:2',
        'campaign_profit' => 'decimal:2',
        'conversion_rate' => 'decimal:2',
        'roi'             => 'decimal:2',
    ];

    // --- Relationships ---

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
