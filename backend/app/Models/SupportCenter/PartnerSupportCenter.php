<?php

namespace App\Models\SupportCenter;

use App\Models\Lookup\Area;
use App\Models\Lookup\Zone;
use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerSupportCenter extends Model
{
    use SoftDeletes;

    protected $table = 'partner_support_centers';

    protected $fillable = [
        'partner_id',
        'sc_id',               // SC-000101 (auto-generated on boot)
        'branch_code',         // ABC-SC-001 (auto-generated on boot)
        'center_name',
        'branch_type',         // Head Office/Branch/Support Center/Franchise
        'address',
        'area_id',
        'zone_id',
        'contact_number',
        'email',
        'branch_manager_id',
        'staff_count',         // cached count
        'working_hours',
        'weekly_off_day',
        'opening_date',
        'service_coverage',
        'status',              // Planned/Active/Temporarily Closed/Suspended/Closed
    ];

    protected $casts = [
        'opening_date' => 'date',
        'staff_count'  => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function ($sc) {
            if (!$sc->sc_id) {
                $next = (int) (self::withTrashed()->max('id')) + 1;
                $sc->sc_id = 'SC-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            }
            if (!$sc->branch_code) {
                $partner = Partner::find($sc->partner_id);
                $codePrefix = $partner?->partner_code ?: 'PMS';
                $next = (int) (self::withTrashed()->where('partner_id', $sc->partner_id)->max('id')) + 1;
                $sc->branch_code = $codePrefix . '-SC-' . str_pad((string) $next, 3, '0', STR_PAD_LEFT);
            }
        });
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function branchManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'branch_manager_id');
    }

    public function staff(): HasMany
    {
        return $this->hasMany(PartnerSupportCenterStaff::class, 'support_center_id');
    }

    public function services(): HasMany
    {
        return $this->hasMany(PartnerSupportCenterService::class, 'support_center_id');
    }

    public function costs(): HasMany
    {
        return $this->hasMany(PartnerSupportCenterCost::class, 'support_center_id');
    }

    public function equipment(): HasMany
    {
        return $this->hasMany(PartnerSupportCenterEquipment::class, 'support_center_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(PartnerSupportCenterHistory::class, 'support_center_id')
            ->orderByDesc('event_date');
    }
}
