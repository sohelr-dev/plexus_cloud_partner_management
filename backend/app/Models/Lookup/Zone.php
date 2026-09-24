<?php

namespace App\Models\Lookup;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Zone lookup — belongs to a territory, parent of areas.
 */
class Zone extends Model
{
    protected $fillable = ['territory_id', 'name', 'code', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function territory(): BelongsTo
    {
        return $this->belongsTo(Territory::class);
    }

    public function areas(): HasMany
    {
        return $this->hasMany(Area::class);
    }
}
