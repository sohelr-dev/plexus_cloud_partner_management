<?php

namespace App\Models\Lookup;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Territory lookup (e.g. Dhaka North) — parent of zones.
 */
class Territory extends Model
{
    protected $fillable = ['name', 'code', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }
}
