<?php

namespace App\Models\Financial;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * PartnerCost model — soft deletable 
 */
class PartnerCost extends Model
{
    use SoftDeletes;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->source_reference)) {
                $model->source_reference = 'CST-' . date('Ymd') . '-' . mt_rand(1000, 9999);
            }
        });
    }

    protected $fillable = [
        'partner_id',
        'cost_date',
        'cost_type',
        'source_reference',
        'source_system',
        'amount',
        'description',
        'created_by',
    ];

    protected $casts = [
        'cost_date' => 'date',
        'amount'    => 'decimal:2',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
