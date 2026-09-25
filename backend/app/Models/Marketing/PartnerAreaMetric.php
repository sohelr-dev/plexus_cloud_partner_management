<?php

namespace App\Models\Marketing;

use App\Models\Lookup\Area;
use App\Models\Lookup\Zone;
use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerAreaMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'area_id',
        'zone_id',
        'metric_date',
        'period_type',
        'customer_count',
        'new_customers',
        'churn_count',
        'growth_rate',
        'bandwidth_mbps',
        'revenue',
        'average_revenue',
    ];

    protected $casts = [
        'metric_date'     => 'date',
        'growth_rate'     => 'decimal:2',
        'bandwidth_mbps'  => 'decimal:2',
        'revenue'         => 'decimal:2',
        'average_revenue' => 'decimal:2',
    ];

    // --- Relationships ---

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }
}
