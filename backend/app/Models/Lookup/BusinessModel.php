<?php

namespace App\Models\Lookup;

use App\Models\Partner\Partner;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BusinessModel extends Model
{
    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function partners(): BelongsToMany
    {
        return $this->belongsToMany(Partner::class, 'partner_business_models')
            ->withPivot('is_active', 'assigned_at', 'assigned_by')
            ->withTimestamps();
    }
}
