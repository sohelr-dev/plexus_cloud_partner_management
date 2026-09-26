<?php

namespace App\Models\Intelligence;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerRiskIndicator extends Model
{
    protected $table = 'partner_risk_indicators';

    protected $fillable = [
        'partner_id',
        'risk_category',
        'risk_type',
        'severity',
        'title',
        'description',
        'trigger_data',
        'is_active',
        'detected_at',
        'resolved_at',
        'detected_by',
    ];

    protected $casts = [
        'trigger_data' => 'array',
        'is_active'    => 'boolean',
        'detected_at'  => 'datetime',
        'resolved_at'  => 'datetime',
    ];

    public const CATEGORIES = [
        'Financial',
        'Marketing',
        'Network',
        'Equipment',
        'Support Center',
        'Contract',
    ];

    public const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

    public static function severityColor(string $severity): string
    {
        return match ($severity) {
            'Critical' => 'danger',
            'High'     => 'warning',
            'Medium'   => 'info',
            'Low'      => 'secondary',
            default    => 'secondary',
        };
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function detectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'detected_by');
    }
}
