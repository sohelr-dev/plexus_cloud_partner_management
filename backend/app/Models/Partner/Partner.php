<?php

namespace App\Models\Partner;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Partner — core entity of the Partner Management module.
 *
 * Column names strictly match:
 * 2026_09_24_000002_create_partners_and_profiles.php
 */
class Partner extends Model
{
    use SoftDeletes;

    /**
     * $fillable columns strictly match the partners migration.
     */
    protected $fillable = [
        'partner_id',          // PT-000125 (unique, auto-generated)
        'partner_code',        // ABC-00125 (unique)
        'partner_name',
        'legal_name',
        'business_name',
        'partner_type',        // Reseller/Distributor/ISP/Corporate/Individual
        'partner_category',    // A/B/C/D
        'contact_person',
        'contact_number',
        'email',
        'address',
        'area_id',
        'zone_id',
        'territory_id',
        'account_manager_id',
        'relationship_manager_id',
        'partner_since',
        'status',              // Draft/Pending Approval/Active/Suspended/Blocked/Inactive/Terminated
        'health_score',        // cached latest score (real history in partner_health_scores)
        'health_status',       // Excellent/Healthy/Watch/Risk/Critical
        'logo_path',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'partner_since' => 'date',
        'health_score'  => 'decimal:2',
    ];

    // Relationships

    public function profile(): HasOne
    {
        return $this->hasOne(PartnerProfile::class);
    }

    public function riskIndicators(): HasMany
    {
        return $this->hasMany(PartnerRiskIndicator::class);
    }

    /** 1:N AI/data-driven insights */
    public function insights(): HasMany
    {
        return $this->hasMany(PartnerInsight::class);
    }

    /** Geographic hierarchy */
    public function territory(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Lookup\Territory::class);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Lookup\Zone::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Lookup\Area::class);
    }

    /** Assigned users */
    public function accountManager(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'account_manager_id');
    }

    public function relationshipManager(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'relationship_manager_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'updated_by');
    }
}
