<?php

namespace App\Models\Financial;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/*
 * PartnerRevenue model — soft deletable
 */
class PartnerRevenue extends Model
{
    use SoftDeletes;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->source_reference)) {
                $model->source_reference = 'INV-' . date('Ymd') . '-' . mt_rand(1000, 9999);
            }
        });
    }

    protected $fillable = [
        'partner_id',
        'revenue_date',
        'revenue_source',
        'source_reference',
        'source_system',
        'amount',
        'description',
        'created_by',
    ];

    protected $casts = [
        'revenue_date' => 'date',
        'amount'       => 'decimal:2',
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
