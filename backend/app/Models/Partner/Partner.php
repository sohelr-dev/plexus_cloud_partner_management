<?php

namespace App\Models\Partner;

use App\Models\Bandwidth\PartnerBandwidthAllocation;
use App\Models\Bandwidth\PartnerBandwidthChange;
use App\Models\Bandwidth\PartnerBandwidthHistory;
use App\Models\Commission\CommissionPayment;
use App\Models\Commission\CommissionRule;
use App\Models\Commission\PartnerCommission;
use App\Models\Document\PartnerDocument;
use App\Models\Equipment\PartnerEndDevice;
use App\Models\Equipment\PartnerEquipment;
use App\Models\Financial\PartnerCost;
use App\Models\Financial\PartnerPayment;
use App\Models\Financial\PartnerProfitLoss;
use App\Models\Financial\PartnerRevenue;
use App\Models\Financial\PartnerRoi;
use App\Models\Lookup\Area;
use App\Models\Lookup\BusinessModel;
use App\Models\Lookup\Territory;
use App\Models\Lookup\Zone;
use App\Models\Marketing\PartnerAreaMetric;
use App\Models\Marketing\PartnerCampaign;
use App\Models\Marketing\PartnerCustomerMetric;
use App\Models\Marketing\PartnerPackageMetric;
use App\Models\Marketing\PartnerSalesMetric;
use App\Models\SupportCenter\PartnerSupportCenter;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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

    public function businessModels(): BelongsToMany
    {
        return $this->belongsToMany(BusinessModel::class, 'partner_business_models')
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
        return $this->belongsTo(Territory::class);
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    /** Assigned users */
    public function accountManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'account_manager_id');
    }

    public function relationshipManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'relationship_manager_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // --- Financial Relationships

    public function revenues(): HasMany
    {
        return $this->hasMany(PartnerRevenue::class);
    }

    public function costs(): HasMany
    {
        return $this->hasMany(PartnerCost::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PartnerPayment::class);
    }

    public function profitLosses(): HasMany
    {
        return $this->hasMany(PartnerProfitLoss::class);
    }

    public function rois(): HasMany
    {
        return $this->hasMany(PartnerRoi::class);
    }

    // --- Bandwidth Relationships ---

    public function bandwidthAllocations(): HasMany
    {
        return $this->hasMany(PartnerBandwidthAllocation::class);
    }

    public function bandwidthChanges(): HasMany
    {
        return $this->hasMany(PartnerBandwidthChange::class);
    }

    public function bandwidthHistories(): HasMany
    {
        return $this->hasMany(PartnerBandwidthHistory::class);
    }

    // --- Equipment & Device Relationships ---

    public function equipments(): HasMany
    {
        return $this->hasMany(PartnerEquipment::class);
    }

    public function endDevices(): HasMany
    {
        return $this->hasMany(PartnerEndDevice::class);
    }

    // --- Commission Relationships ---

    public function commissionRules(): HasMany
    {
        return $this->hasMany(CommissionRule::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(PartnerCommission::class);
    }

    public function commissionPayments(): HasMany
    {
        return $this->hasMany(CommissionPayment::class);
    }

    // --- Support Center Relationships

    public function supportCenters(): HasMany
    {
        return $this->hasMany(PartnerSupportCenter::class);
    }

    // --- Marketing Relationships ---

    public function campaigns(): HasMany
    {
        return $this->hasMany(PartnerCampaign::class);
    }

    public function customerMetrics(): HasMany
    {
        return $this->hasMany(PartnerCustomerMetric::class);
    }

    public function salesMetrics(): HasMany
    {
        return $this->hasMany(PartnerSalesMetric::class);
    }

    public function packageMetrics(): HasMany
    {
        return $this->hasMany(PartnerPackageMetric::class);
    }

    public function areaMetrics(): HasMany
    {
        return $this->hasMany(PartnerAreaMetric::class);
    }


    public function documents(): HasMany
    {
        return $this->hasMany(PartnerDocument::class);
    }

    public function timelineEvents(): HasMany
    {
        return $this->hasMany(PartnerTimelineEvent::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(PartnerNote::class);
    }
}
