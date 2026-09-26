<?php

namespace App\Models\Partner;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;


class PartnerNote extends Model
{
    use SoftDeletes;

    protected $table = 'partner_notes';

    public const CATEGORIES = [
        'Management',
        'Sales',
        'Finance',
        'Network',
        'Marketing',
        'Support Center',
        'General',
    ];

    public const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

    public const VISIBILITIES = ['Internal', 'Management Only', 'Public to Partner'];

    protected $fillable = [
        'partner_id',
        'note',
        'category',
        'priority',
        'visibility',
        'attachment_path',
        'attachment_name',
        'is_pinned',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
