<?php

namespace App\Models\Marketing;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerPackageMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'package_name',
        'metric_date',
        'period_type',
        'customer_count',
        'new_sales',
        'renewals',
        'churn_count',
        'growth_rate',
        'revenue',
        'average_revenue',
    ];

    protected $casts = [
        'metric_date'     => 'date',
        'growth_rate'     => 'decimal:2',
        'revenue'         => 'decimal:2',
        'average_revenue' => 'decimal:2',
    ];

    // --- Relationships ---

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }
}
