<?php

namespace App\Models\Partner;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerRelationshipHistory extends Model
{
    use HasFactory;

    protected $table = 'partner_relationship_history';

    protected $fillable = [
        'partner_id',
        'previous_manager_id',
        'new_manager_id',
        'assignment_date',
        'transfer_date',
        'transfer_reason',
        'created_by',
    ];

    protected $casts = [
        'assignment_date' => 'date',
        'transfer_date'   => 'date',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function previousManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'previous_manager_id');
    }

    public function newManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'new_manager_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
