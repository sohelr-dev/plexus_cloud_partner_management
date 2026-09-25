<?php

namespace App\Models\Marketing;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerSalesMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'metric_date',
        'period_type',
        'sales_target',
        'actual_sales',
        'achievement_percentage',
        'new_sales_count',
        'renewal_sales_count',
        'package_sales_count',
        'upgrade_sales_count',
        'downgrade_sales_count',
        'total_revenue',
        'average_revenue_per_customer',
    ];

    protected $casts = [
        'metric_date'                  => 'date',
        'sales_target'                 => 'decimal:2',
        'actual_sales'                 => 'decimal:2',
        'achievement_percentage'       => 'decimal:2',
        'total_revenue'                => 'decimal:2',
        'average_revenue_per_customer' => 'decimal:2',
    ];

    // --- Relationships ---

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }
}
