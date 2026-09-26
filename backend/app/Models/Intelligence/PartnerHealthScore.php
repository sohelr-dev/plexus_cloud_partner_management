<?php

namespace App\Models\Intelligence;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerHealthScore extends Model
{
    protected $table = 'partner_health_scores';

    protected $fillable = [
        'partner_id',
        'total_score',
        'status',
        'financial_health_score',
        'revenue_growth_score',
        'profitability_score',
        'payment_behavior_score',
        'bandwidth_growth_score',
        'customer_growth_score',
        'operational_score',
        'calculation_data',
        'period',
        'calculated_by',
        'calculated_at',
    ];

    protected $casts = [
        'total_score'             => 'float',
        'financial_health_score'  => 'float',
        'revenue_growth_score'    => 'float',
        'profitability_score'     => 'float',
        'payment_behavior_score'  => 'float',
        'bandwidth_growth_score'  => 'float',
        'customer_growth_score'   => 'float',
        'operational_score'       => 'float',
        'calculation_data'        => 'array',
        'calculated_at'           => 'datetime',
    ];

    public const STATUS_THRESHOLDS = [
        'Excellent' => 90,
        'Healthy'   => 75,
        'Watch'     => 60,
        'Risk'      => 40,
        'Critical'  => 0,
    ];

    public const WEIGHTS = [
        'financial_health'  => 0.25,
        'revenue_growth'    => 0.20,
        'profitability'     => 0.20,
        'payment_behavior'  => 0.10,
        'bandwidth_growth'  => 0.10,
        'customer_growth'   => 0.10,
        'operational'       => 0.05,
    ];

    public static function statusFor(float $score): string
    {
        if ($score >= 90) return 'Excellent';
        if ($score >= 75) return 'Healthy';
        if ($score >= 60) return 'Watch';
        if ($score >= 40) return 'Risk';
        return 'Critical';
    }

    public static function statusColor(string $status): string
    {
        return match ($status) {
            'Excellent' => 'success',
            'Healthy'   => 'primary',
            'Watch'     => 'warning',
            'Risk'      => 'orange',
            'Critical'  => 'danger',
            default     => 'secondary',
        };
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function calculatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }
}
