<?php

namespace App\Models\Marketing;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartnerCustomerMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_id',
        'metric_date',
        'period_type',
        'opening_customers',
        'new_customers',
        'reactivations',
        'renewals',
        'suspensions',
        'terminations',
        'churn_customers',
        'closing_customers',
        'growth_rate',
        'churn_rate',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'growth_rate' => 'decimal:2',
        'churn_rate'  => 'decimal:2',
    ];

    // --- Relationships ---

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }
}
