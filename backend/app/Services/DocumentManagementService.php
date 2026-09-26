<?php

namespace App\Services;

use App\Models\Document\PartnerDocument;
use App\Models\Document\PartnerDocumentExpiry;
use App\Models\Document\PartnerDocumentVersion;
use App\Models\Partner\Partner;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;


class DocumentManagementService
{
    public const DISK   = 'public';
    public const FOLDER = 'partner-documents';

    public const CATEGORIES = [
        'Legal' => [
            'Partner Agreement',
            'Contract',
            'Amendment',
            'Authorization',
            'Trade License',
            'Tax Document',
        ],
        'Financial' => [
            'Invoice',
            'Payment Receipt',
            'Security Deposit',
            'Credit Approval',
        ],
        'Network' => [
            'Bandwidth Work Order',
            'Capacity Approval',
            'Equipment List',
            'Network Diagram',
        ],
        'Support Center' => [
            'Branch Agreement',
            'Rent Agreement',
            'Branch Approval',
            'Branch Equipment List',
            'Branch Document',
        ],
    ];

    public const STATUSES = ['Draft', 'Pending Approval', 'Active', 'Expired', 'Rejected', 'Archived'];

    public const ALERT_DAYS = [90, 60, 30, 15, 7, 0];

    public static function getSummary(Partner $partner): array
    {
        $documents = PartnerDocument::with(['uploadedBy:id,name', 'approvedBy:id,name', 'supportCenter:id,center_name,sc_id'])
            ->where('partner_id', $partner->id)
            ->orderByDesc('created_at')
            ->get();

        $today = now()->startOfDay();

        $summary = [
            'total_documents'   => $documents->count(),
            'active_documents'  => $documents->where('status', 'Active')->count(),
            'pending_approval'  => $documents->where('status', 'Pending Approval')->count(),
            'expired_documents' => $documents->filter(fn($d) => $d->expiry_date && $d->expiry_date->lt($today))->count(),
            'expiring_soon'     => $documents->filter(function ($d) use ($today) {
                if (! $d->expiry_date) {
                    return false;
                }
                $days = $today->diffInDays($d->expiry_date, false);
                return $days >= 0 && $days <= 90;
            })->count(),
            'by_category'       => $documents->groupBy('category')->map->count(),
            'categories'        => self::CATEGORIES,
            'statuses'          => self::STATUSES,
        ];

        $documents->each(function ($doc) {
            $doc->append(['days_to_expiry', 'is_expired', 'expiry_level']);
        });

        return array_merge($summary, ['documents' => $documents]);
    }


    public static function expiryAlerts(Partner $partner, bool $onlyUnacknowledged = false): array
    {
        $query = PartnerDocumentExpiry::with(['document:id,document_id,document_name,category,document_type,expiry_date,status'])
            ->where('partner_id', $partner->id)
            ->where('alert_date', '<=', now()->toDateString())
            ->orderBy('level')
            ->orderBy('expiry_date');

        if ($onlyUnacknowledged) {
            $query->where('acknowledged', false);
        }

        $alerts = $query->get();

        return [
            'total_alerts'         => $alerts->count(),
            'unacknowledged'       => $alerts->where('acknowledged', false)->count(),
            'expired'              => $alerts->where('level', 'Expired')->count(),
            'critical'             => $alerts->where('level', 'Critical')->count(),
            'warning'              => $alerts->where('level', 'Warning')->count(),
            'alerts'               => $alerts,
        ];
    }


    public static function createDocument(Partner $partner, array $data, ?UploadedFile $file = null, ?User $actor = null): PartnerDocument
    {
        return DB::transaction(function () use ($partner, $data, $file, $actor) {
            [$filePath, $fileName, $mime, $size] = self::storeFile($file, $data['document_name'] ?? 'document');

            $document = PartnerDocument::create([
                'partner_id'       => $partner->id,
                'support_center_id' => $data['support_center_id'] ?? null,
                'document_name'    => $data['document_name'],
                'category'         => $data['category'],
                'document_type'    => $data['document_type'],
                'version'          => $data['version'] ?? '1.0',
                'status'           => $data['status'] ?? 'Draft',
                'effective_date'   => $data['effective_date'] ?? null,
                'expiry_date'      => $data['expiry_date'] ?? null,
                'uploaded_by'      => $actor?->id,
                'file_path'        => $filePath,
                'file_name'        => $fileName,
                'mime_type'        => $mime,
                'file_size'        => $size,
                'remarks'          => $data['remarks'] ?? null,
            ]);

            self::createVersionRow($document, $document->version, $data['change_notes'] ?? 'Initial upload', $actor);

            self::syncExpiryAlerts($document);

            TimelineService::record(
                $partner,
                'Document Uploaded',
                'Documents',
                "Document uploaded: {$document->document_name}",
                "{$document->category} → {$document->document_type} (v{$document->version})",
                [
                    'severity'        => 'Info',
                    'reference_type'  => 'PartnerDocument',
                    'reference_id'    => $document->id,
                    'reference_label' => $document->document_id,
                    'meta'            => ['category' => $document->category, 'type' => $document->document_type],
                    'performed_by'    => $actor,
                ]
            );

            AuditLogService::log(
                'document.uploaded',
                $document,
                null,
                $document->toArray(),
                "Uploaded document {$document->document_id} ({$document->document_name}) for partner #{$partner->id}."
            );

            return $document->fresh(['versions', 'uploadedBy', 'expiryAlerts']);
        });
    }

    public static function updateDocument(PartnerDocument $document, array $data, ?User $actor = null): PartnerDocument
    {
        return DB::transaction(function () use ($document, $data, $actor) {
            $old = $document->getOriginal();

            $document->update($data);

            if (array_key_exists('expiry_date', $data) && ($old['expiry_date'] ?? null) != $document->expiry_date) {
                $document->expiryAlerts()->delete();
                self::syncExpiryAlerts($document);

                TimelineService::recordForModel(
                    $document,
                    'Document Expiry Updated',
                    'Documents',
                    "Expiry updated: {$document->document_name}",
                    'New expiry: ' . ($document->expiry_date?->toDateString() ?? 'N/A'),
                    ['severity' => 'Warning', 'reference_label' => $document->document_id, 'performed_by' => $actor]
                );
            }

            AuditLogService::log(
                'document.updated',
                $document,
                $old,
                $document->fresh()->toArray(),
                "Updated document {$document->document_id}."
            );

            return $document->fresh(['versions', 'uploadedBy', 'approvedBy', 'expiryAlerts']);
        });
    }


    public static function addVersion(
        PartnerDocument $document,
        string $version,
        array $data = [],
        ?UploadedFile $file = null,
        ?User $actor = null,
    ): PartnerDocument {
        return DB::transaction(function () use ($document, $version, $data, $file, $actor) {
            $oldVersion = $document->version;
            $old = $document->getOriginal();

            [$filePath, $fileName, $mime, $size] = self::storeFile($file, $document->document_name, $version);

            PartnerDocumentVersion::where('document_id', $document->id)->update(['is_current' => false]);

            PartnerDocumentVersion::create([
                'document_id'    => $document->id,
                'version'        => $version,
                'is_current'     => true,
                'file_path'      => $filePath ?? $document->file_path,
                'file_name'      => $fileName ?? $document->file_name,
                'mime_type'      => $mime ?? $document->mime_type,
                'file_size'      => $size ?? $document->file_size,
                'effective_date' => $data['effective_date'] ?? $document->effective_date,
                'expiry_date'    => $data['expiry_date'] ?? $document->expiry_date,
                'uploaded_by'    => $actor?->id,
                'change_notes'   => $data['change_notes'] ?? null,
            ]);

            $document->update(array_filter([
                'version'        => $version,
                'file_path'      => $filePath,
                'file_name'      => $fileName,
                'mime_type'      => $mime,
                'file_size'      => $size,
                'effective_date' => $data['effective_date'] ?? null,
                'expiry_date'    => $data['expiry_date'] ?? null,
                'status'         => $data['status'] ?? $document->status,
                'remarks'        => $data['remarks'] ?? $document->remarks,
            ], fn($v) => $v !== null));

            $document->expiryAlerts()->delete();
            self::syncExpiryAlerts($document->fresh());

            TimelineService::recordForModel(
                $document,
                'Document Version Added',
                'Documents',
                "New version v{$version}: {$document->document_name}",
                "Version {$oldVersion} → {$version}" . (! empty($data['change_notes']) ? ". {$data['change_notes']}" : ''),
                [
                    'severity'        => 'Info',
                    'reference_label' => $document->document_id,
                    'meta'            => ['previous_version' => $oldVersion, 'new_version' => $version],
                    'performed_by'    => $actor,
                ]
            );

            AuditLogService::log(
                'document.version_added',
                $document,
                $old,
                $document->fresh()->toArray(),
                "Added version {$version} to document {$document->document_id} (was {$oldVersion})."
            );

            return $document->fresh(['versions', 'uploadedBy', 'approvedBy', 'expiryAlerts']);
        });
    }


    public static function changeStatus(PartnerDocument $document, string $status, ?string $reason, ?User $actor = null): PartnerDocument
    {
        $oldStatus = $document->status;

        $document->update([
            'status'      => $status,
            'approved_by' => in_array($status, ['Active', 'Rejected'], true) ? $actor?->id : $document->approved_by,
            'approved_at' => in_array($status, ['Active', 'Rejected'], true) ? now() : $document->approved_at,
        ]);

        TimelineService::recordForModel(
            $document,
            "Document {$status}",
            'Documents',
            "Document {$status}: {$document->document_name}",
            "Status {$oldStatus} → {$status}" . ($reason ? ". Reason: {$reason}" : ''),
            [
                'severity'        => $status === 'Rejected' ? 'Danger' : ($status === 'Active' ? 'Success' : 'Info'),
                'reference_label' => $document->document_id,
                'performed_by'    => $actor,
            ]
        );

        AuditLogService::log(
            'document.status_changed',
            $document,
            ['status' => $oldStatus],
            ['status' => $status],
            $reason ?? "Document {$document->document_id} status changed to {$status}."
        );

        return $document->fresh(['versions', 'uploadedBy', 'approvedBy']);
    }


    public static function deleteDocument(PartnerDocument $document, ?string $reason, ?User $actor = null): void
    {
        $label = $document->document_name;

        $document->delete();

        TimelineService::recordForModel(
            $document,
            'Document Deleted',
            'Documents',
            "Document deleted: {$label}",
            $reason,
            ['severity' => 'Danger', 'reference_label' => $document->document_id, 'performed_by' => $actor]
        );

        AuditLogService::log(
            'document.deleted',
            $document,
            ['deleted_at' => null],
            ['deleted_at' => now()->toDateTimeString()],
            $reason ?? "Document {$document->document_id} deleted."
        );
    }


    public static function acknowledgeAlert(PartnerDocumentExpiry $alert, ?User $actor = null): PartnerDocumentExpiry
    {
        $alert->update([
            'acknowledged'    => true,
            'acknowledged_by' => $actor?->id,
            'acknowledged_at' => now(),
        ]);

        return $alert->fresh();
    }


    public static function syncExpiryAlerts(PartnerDocument $document): int
    {
        if (! $document->expiry_date) {
            return 0;
        }

        $expiry = Carbon::parse($document->expiry_date)->startOfDay();
        $created = 0;

        foreach (self::ALERT_DAYS as $days) {
            $alertDate = $expiry->copy()->subDays($days);

            PartnerDocumentExpiry::updateOrCreate(
                [
                    'document_id' => $document->id,
                    'alert_days'  => $days,
                ],
                [
                    'partner_id'  => $document->partner_id,
                    'expiry_date' => $expiry->toDateString(),
                    'alert_date'  => $alertDate->toDateString(),
                    'level'       => PartnerDocumentExpiry::levelFor($days),
                ]
            );

            $created++;
        }

        return $created;
    }


    public static function refreshAllExpiryAlerts(): array
    {
        $documents = PartnerDocument::whereNotNull('expiry_date')->get();

        $alertsSynced = 0;
        $markedExpired = 0;

        foreach ($documents as $document) {
            $document->expiryAlerts()->delete();
            $alertsSynced += self::syncExpiryAlerts($document);

            if ($document->expiry_date->isPast() && $document->status === 'Active') {
                $document->update(['status' => 'Expired']);
                $markedExpired++;

                TimelineService::recordForModel(
                    $document,
                    'Document Expired',
                    'Documents',
                    "Document expired: {$document->document_name}",
                    'Expiry date: ' . $document->expiry_date->toDateString(),
                    [
                        'severity'        => 'Danger',
                        'reference_label' => $document->document_id,
                        'performed_by'    => null,
                    ]
                );
            }
        }

        return [
            'documents_processed' => $documents->count(),
            'alerts_synced'       => $alertsSynced,
            'marked_expired'      => $markedExpired,
        ];
    }


    private static function storeFile(?UploadedFile $file, string $baseName, ?string $version = null): array
    {
        if (! $file) {
            return [null, null, null, null];
        }

        $slug = \Illuminate\Support\Str::slug($baseName) ?: 'document';
        $name = $slug . ($version ? "-v{$version}" : '') . '-' . now()->format('YmdHis') . '.' . $file->getClientOriginalExtension();

        $path = $file->storeAs(self::FOLDER, $name, self::DISK);

        return [
            $path,
            $file->getClientOriginalName(),
            $file->getClientMimeType(),
            $file->getSize(),
        ];
    }

    private static function createVersionRow(PartnerDocument $document, string $version, ?string $notes, ?User $actor): PartnerDocumentVersion
    {
        PartnerDocumentVersion::where('document_id', $document->id)->update(['is_current' => false]);

        return PartnerDocumentVersion::create([
            'document_id'    => $document->id,
            'version'        => $version,
            'is_current'     => true,
            'file_path'      => $document->file_path ?? '',
            'file_name'      => $document->file_name,
            'mime_type'      => $document->mime_type,
            'file_size'      => $document->file_size,
            'effective_date' => $document->effective_date,
            'expiry_date'    => $document->expiry_date,
            'uploaded_by'    => $actor?->id,
            'change_notes'   => $notes,
        ]);
    }

    public static function nextVersion(string $current): string
    {
        $parts = explode('.', $current);

        if (count($parts) < 2) {
            return (((int) $current) + 1) . '.0';
        }

        $major = (int) $parts[0];
        $minor = (int) $parts[1];

        if ($minor >= 9) {
            return ($major + 1) . '.0';
        }

        return $major . '.' . ($minor + 1);
    }


    public static function fileUrl(?string $path): ?string
    {
        return $path ? Storage::disk(self::DISK)->url($path) : null;
    }
}
