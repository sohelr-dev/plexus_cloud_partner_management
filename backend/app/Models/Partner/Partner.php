<?php

namespace App\Models\Partner;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Partner — core entity of the Partner Management module.
 */
class Partner extends Model
{
    use SoftDeletes;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->partner_id)) {
                $model->partner_id = 'PT-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
            }
            if (empty($model->partner_code)) {
                $model->partner_code = 'P-' . strtoupper(\Illuminate\Support\Str::random(6));
            }
        });
    }

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

    public function businessModels(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Models\Lookup\BusinessModel::class, 'partner_business_models')
            ->withPivot('is_active', 'assigned_at', 'assigned_by')
            ->withTimestamps();
    }

    public function riskIndicators(): HasMany
    {
        return $this->hasMany(PartnerRiskIndicator::class);
    }

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

    // --- Financial Relationships 

    public function revenues(): HasMany
    {
        return $this->hasMany(\App\Models\Financial\PartnerRevenue::class);
    }

    public function costs(): HasMany
    {
        return $this->hasMany(\App\Models\Financial\PartnerCost::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(\App\Models\Financial\PartnerPayment::class);
    }

    public function profitLosses(): HasMany
    {
        return $this->hasMany(\App\Models\Financial\PartnerProfitLoss::class);
    }

    public function rois(): HasMany
    {
        return $this->hasMany(\App\Models\Financial\PartnerRoi::class);
    }

    // --- Bandwidth Relationships ---

    public function bandwidthAllocations(): HasMany
    {
        return $this->hasMany(\App\Models\Bandwidth\PartnerBandwidthAllocation::class);
    }

    public function bandwidthChanges(): HasMany
    {
        return $this->hasMany(\App\Models\Bandwidth\PartnerBandwidthChange::class);
    }

    public function bandwidthHistories(): HasMany
    {
        return $this->hasMany(\App\Models\Bandwidth\PartnerBandwidthHistory::class);
    }

    // --- Equipment & Device Relationships ---

    public function equipments(): HasMany
    {
        return $this->hasMany(\App\Models\Equipment\PartnerEquipment::class);
    }

    public function endDevices(): HasMany
    {
        return $this->hasMany(\App\Models\Equipment\PartnerEndDevice::class);
    }

    // --- Commission Relationships ---

    public function commissionRules(): HasMany
    {
        return $this->hasMany(\App\Models\Commission\CommissionRule::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(\App\Models\Commission\PartnerCommission::class);
    }

    public function commissionPayments(): HasMany
    {
        return $this->hasMany(\App\Models\Commission\CommissionPayment::class);
    }
}
