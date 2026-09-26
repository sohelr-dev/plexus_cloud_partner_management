<?php

namespace App\Models\Document;

use App\Models\Partner\Partner;
use App\Models\SupportCenter\PartnerSupportCenter;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;


class PartnerDocument extends Model
{
    use SoftDeletes;

    protected $table = 'partner_documents';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->document_id)) {
                $model->document_id = self::generateDocumentId();
            }
            if (empty($model->version)) {
                $model->version = '1.0';
            }
        });
    }


    public static function generateDocumentId(): string
    {
        $last = static::withTrashed()->orderByDesc('id')->value('document_id');

        $next = 101;
        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            $next = ((int) $m[1]) + 1;
        }

        do {
            $candidate = 'DOC-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            $exists = static::withTrashed()->where('document_id', $candidate)->exists();
            $next++;
        } while ($exists);

        return $candidate;
    }

    protected $fillable = [
        'document_id',
        'partner_id',
        'support_center_id',
        'document_name',
        'category',          // Legal/Financial/Network/Support Center
        'document_type',     // Section 69 list
        'version',
        'status',            // Draft/Pending Approval/Active/Expired/Rejected/Archived
        'effective_date',
        'expiry_date',
        'uploaded_by',
        'approved_by',
        'approved_at',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'remarks',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'expiry_date'    => 'date',
        'approved_at'    => 'datetime',
        'file_size'      => 'integer',
    ];

  
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function supportCenter(): BelongsTo
    {
        return $this->belongsTo(PartnerSupportCenter::class, 'support_center_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PartnerDocumentVersion::class, 'document_id')->orderByDesc('id');
    }

    public function currentVersion(): HasMany
    {
        return $this->hasMany(PartnerDocumentVersion::class, 'document_id')->where('is_current', true);
    }

    public function expiryAlerts(): HasMany
    {
        return $this->hasMany(PartnerDocumentExpiry::class, 'document_id')->orderBy('alert_days');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function getDaysToExpiryAttribute(): ?int
    {
        if (! $this->expiry_date) {
            return null;
        }

        return (int) now()->startOfDay()->diffInDays($this->expiry_date, false);
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }


    public function getExpiryLevelAttribute(): ?string
    {
        $days = $this->days_to_expiry;

        if ($days === null) {
            return null;
        }
        if ($days < 0) {
            return 'Expired';
        }
        if ($days <= 7) {
            return 'Critical';
        }
        if ($days <= 30) {
            return 'Warning';
        }
        if ($days <= 90) {
            return 'Info';
        }

        return null;
    }
}
