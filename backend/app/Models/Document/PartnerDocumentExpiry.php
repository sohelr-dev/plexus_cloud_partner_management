<?php

namespace App\Models\Document;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class PartnerDocumentExpiry extends Model
{
    protected $table = 'partner_document_expiry';

    public const DEFAULT_THRESHOLDS = [90, 60, 30, 15, 7, 0];

    protected $fillable = [
        'document_id',
        'partner_id',
        'alert_days',
        'expiry_date',
        'alert_date',
        'level',
        'acknowledged',
        'acknowledged_by',
        'acknowledged_at',
        'remarks',
    ];

    protected $casts = [
        'alert_days'      => 'integer',
        'expiry_date'     => 'date',
        'alert_date'      => 'date',
        'acknowledged'    => 'boolean',
        'acknowledged_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(PartnerDocument::class, 'document_id');
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public static function levelFor(int $alertDays): string
    {
        return match (true) {
            $alertDays <= 0  => 'Expired',
            $alertDays <= 7  => 'Critical',
            $alertDays <= 30 => 'Warning',
            default          => 'Info',
        };
    }
}
