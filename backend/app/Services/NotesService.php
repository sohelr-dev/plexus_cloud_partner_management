<?php

namespace App\Services;

use App\Models\Partner\Partner;
use App\Models\Partner\PartnerNote;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;


class NotesService
{
    public const DISK   = 'public';
    public const FOLDER = 'partner-notes';

    public static function paginate(Partner $partner, array $filters = []): LengthAwarePaginator
    {
        return self::query($partner, $filters)
            ->with(['creator:id,name', 'updater:id,name'])
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 20));
    }

    public static function query(Partner $partner, array $filters = []): Builder
    {
        $query = PartnerNote::query()->where('partner_id', $partner->id);

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (! empty($filters['visibility'])) {
            $query->where('visibility', $filters['visibility']);
        }

        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->where('note', 'like', "%{$term}%");
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query;
    }


    public static function summary(Partner $partner): array
    {
        $notes = PartnerNote::where('partner_id', $partner->id)->get();

        return [
            'total_notes'  => $notes->count(),
            'pinned'       => $notes->where('is_pinned', true)->count(),
            'urgent'       => $notes->whereIn('priority', ['High', 'Urgent'])->count(),
            'by_category'  => $notes->groupBy('category')->map->count(),
            'categories'   => PartnerNote::CATEGORIES,
            'priorities'   => PartnerNote::PRIORITIES,
            'visibilities' => PartnerNote::VISIBILITIES,
        ];
    }


    public static function create(Partner $partner, array $data, ?UploadedFile $attachment = null, ?User $actor = null): PartnerNote
    {
        [$path, $name] = self::storeAttachment($attachment, $data['category'] ?? 'General');

        $note = PartnerNote::create([
            'partner_id'      => $partner->id,
            'note'            => $data['note'],
            'category'        => $data['category'] ?? 'General',
            'priority'        => $data['priority'] ?? 'Normal',
            'visibility'      => $data['visibility'] ?? 'Internal',
            'attachment_path' => $path,
            'attachment_name' => $name,
            'is_pinned'       => (bool) ($data['is_pinned'] ?? false),
            'created_by'      => $actor?->id,
            'updated_by'      => $actor?->id,
        ]);

        TimelineService::record(
            $partner,
            'Note Added',
            'System',
            "{$note->category} note added",
            \Illuminate\Support\Str::limit($note->note, 160),
            [
                'severity'        => $note->priority === 'Urgent' ? 'Warning' : 'Info',
                'reference_type'  => 'PartnerNote',
                'reference_id'    => $note->id,
                'meta'            => ['priority' => $note->priority, 'visibility' => $note->visibility],
                'performed_by'    => $actor,
            ]
        );

        AuditLogService::log(
            'note.created',
            $note,
            null,
            $note->only(['partner_id', 'category', 'priority', 'visibility']),
            "Note added on partner #{$partner->id} ({$note->category})."
        );

        return $note->fresh(['creator:id,name']);
    }


    public static function update(PartnerNote $note, array $data, ?UploadedFile $attachment = null, ?User $actor = null): PartnerNote
    {
        $old = $note->getOriginal();

        $payload = [
            'note'       => $data['note'] ?? $note->note,
            'category'   => $data['category'] ?? $note->category,
            'priority'   => $data['priority'] ?? $note->priority,
            'visibility' => $data['visibility'] ?? $note->visibility,
            'is_pinned'  => array_key_exists('is_pinned', $data) ? (bool) $data['is_pinned'] : $note->is_pinned,
            'updated_by' => $actor?->id,
        ];

        if ($attachment) {
            [$path, $name] = self::storeAttachment($attachment, $payload['category']);
            $payload['attachment_path'] = $path;
            $payload['attachment_name'] = $name;
        }

        $note->update($payload);

        AuditLogService::log(
            'note.updated',
            $note,
            $old,
            $note->fresh()->toArray(),
            "Note #{$note->id} updated."
        );

        return $note->fresh(['creator:id,name', 'updater:id,name']);
    }


    public static function togglePin(PartnerNote $note, ?User $actor = null): PartnerNote
    {
        $note->update([
            'is_pinned'  => ! $note->is_pinned,
            'updated_by' => $actor?->id,
        ]);

        return $note->fresh();
    }


    public static function delete(PartnerNote $note, ?User $actor = null): void
    {
        $note->update(['updated_by' => $actor?->id]);
        $note->delete();

        AuditLogService::log(
            'note.deleted',
            $note,
            ['deleted_at' => null],
            ['deleted_at' => now()->toDateTimeString()],
            "Note #{$note->id} deleted."
        );
    }


    public static function attachmentUrl(?string $path): ?string
    {
        return $path ? Storage::disk(self::DISK)->url($path) : null;
    }

    private static function storeAttachment(?UploadedFile $file, string $category): array
    {
        if (! $file) {
            return [null, null];
        }

        $name = \Illuminate\Support\Str::slug($category) . '-' . now()->format('YmdHis') . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs(self::FOLDER, $name, self::DISK);

        return [$path, $file->getClientOriginalName()];
    }
}
