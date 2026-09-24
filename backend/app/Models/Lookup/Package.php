<?php

namespace App\Models\Lookup;

use Illuminate\Database\Eloquent\Model;

/**
 * Package lookup — ISP bandwidth packages (name, speed, price).
 */
class Package extends Model
{
    protected $fillable = [
        'name',
        'code',
        'speed_mbps',
        'monthly_price',
        'billing_cycle',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'monthly_price' => 'decimal:2',
    ];
}
