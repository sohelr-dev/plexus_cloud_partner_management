<?php

namespace App\Models\Lookup;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Area lookup — smallest geographic unit, belongs to a zone.
 */
class Area extends Model
{
    protected $fillable = ['zone_id', 'name', 'code', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }
}
