<?php

namespace App\Models\Document;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class PartnerDocumentVersion extends Model
{
    protected $table = 'partner_document_versions';

    protected $fillable = [
        'document_id',
        'version',
        'is_current',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'effective_date',
        'expiry_date',
        'uploaded_by',
        'change_notes',
    ];

    protected $casts = [
        'is_current'     => 'boolean',
        'file_size'      => 'integer',
        'effective_date' => 'date:Y-m-d',
        'expiry_date'    => 'date:Y-m-d',
    ];

    protected $appends = ['file_url'];

    public function getFileUrlAttribute(): ?string
    {
        if (! $this->file_path) {
            return null;
        }

        if (str_starts_with($this->file_path, 'http://') || str_starts_with($this->file_path, 'https://')) {
            return $this->file_path;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->file_path);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(PartnerDocument::class, 'document_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
