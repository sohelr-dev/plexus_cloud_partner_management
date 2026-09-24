<?php

namespace App\Models\Financial;

use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * PartnerPayment model — soft deletable
 */
class PartnerPayment extends Model
{
    use SoftDeletes;

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->reference_number)) {
                $model->reference_number = 'PAY-' . date('Ymd') . '-' . mt_rand(1000, 9999);
            }
        });
    }

    protected $fillable = [
        'partner_id',
        'payment_date',
        'payment_method',
        'amount',
        'reference_number',
        'status',
        'remarks',
        'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
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
