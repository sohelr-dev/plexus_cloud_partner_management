<?php

namespace App\Models\Partner;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerRelationship extends Model
{
    use HasFactory;

    protected $table = 'partner_relationships';

    protected $fillable = [
        'partner_id',
        'current_account_manager_id',
        'relationship_status',
        'last_meeting_date',
        'next_follow_up_date',
        'notes',
    ];

    protected $casts = [
        'last_meeting_date'   => 'date',
        'next_follow_up_date' => 'date',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function currentAccountManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_account_manager_id');
    }
}
