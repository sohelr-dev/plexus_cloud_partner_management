<?php

namespace App\Http\Controllers\Api\V1\Document;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Document\PartnerDocument;
use App\Models\Document\PartnerDocumentExpiry;
use App\Models\Partner\Partner;
use App\Services\DocumentManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class DocumentController extends ApiController
{

    public function index(Partner $partner): JsonResponse
    {
        return $this->success(
            DocumentManagementService::getSummary($partner),
            'Partner documents loaded.'
        );
    }


    public function store(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $document = DocumentManagementService::createDocument(
            $partner,
            $validated,
            $request->file('file'),
            $request->user()
        );

        return $this->success($this->present($document), 'Document uploaded successfully.', 201);
    }

    public function show(PartnerDocument $document): JsonResponse
    {
        $document->load([
            'versions.uploadedBy:id,name',
            'uploadedBy:id,name',
            'approvedBy:id,name',
            'supportCenter:id,center_name,sc_id',
            'expiryAlerts',
        ]);
        $document->append(['days_to_expiry', 'is_expired', 'expiry_level']);

        return $this->success($this->present($document), 'Document loaded.');
    }

    public function update(Request $request, PartnerDocument $document): JsonResponse
    {
        $validated = $request->validate($this->rules(partial: true));

        $updated = DocumentManagementService::updateDocument($document, $validated, $request->user());

        return $this->success($this->present($updated), 'Document updated.');
    }


    public function addVersion(Request $request, PartnerDocument $document): JsonResponse
    {
        $validated = $request->validate([
            'version'        => ['nullable', 'string', 'max:20'],
            'effective_date' => ['nullable', 'date'],
            'expiry_date'    => ['nullable', 'date', 'after_or_equal:effective_date'],
            'status'         => ['nullable', 'string', 'in:' . implode(',', DocumentManagementService::STATUSES)],
            'remarks'        => ['nullable', 'string', 'max:2000'],
            'change_notes'   => ['nullable', 'string', 'max:2000'],
            'file'           => ['nullable', 'file', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif', 'max:20480'],
        ]);

        $version = $validated['version'] ?? DocumentManagementService::nextVersion($document->version);

        $updated = DocumentManagementService::addVersion(
            $document,
            $version,
            $validated,
            $request->file('file'),
            $request->user()
        );

        return $this->success($this->present($updated), "Version {$version} added — previous versions remain available (BR-10).", 201);
    }

    public function versions(PartnerDocument $document): JsonResponse
    {
        $versions = $document->versions()->with('uploadedBy:id,name')->get()->map(fn($v) => [
            'id'             => $v->id,
            'version'        => $v->version,
            'is_current'     => $v->is_current,
            'file_url'       => DocumentManagementService::fileUrl($v->file_path),
            'file_name'      => $v->file_name,
            'file_size'      => $v->file_size,
            'effective_date' => $v->effective_date?->toDateString(),
            'expiry_date'    => $v->expiry_date?->toDateString(),
            'uploaded_by'    => $v->uploadedBy?->name,
            'change_notes'   => $v->change_notes,
            'created_at'     => $v->created_at?->toDateTimeString(),
        ]);

        return $this->success([
            'document_id'     => $document->document_id,
            'current_version' => $document->version,
            'next_version'    => DocumentManagementService::nextVersion($document->version),
            'total_versions'  => $versions->count(),
            'versions'        => $versions,
        ], 'Document version history loaded (BR-10).');
    }

    public function changeStatus(Request $request, PartnerDocument $document): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:' . implode(',', DocumentManagementService::STATUSES)],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $updated = DocumentManagementService::changeStatus(
            $document,
            $validated['status'],
            $validated['reason'] ?? null,
            $request->user()
        );

        return $this->success($this->present($updated), "Document status changed to {$validated['status']}.");
    }

    public function destroy(Request $request, PartnerDocument $document): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        DocumentManagementService::deleteDocument($document, $validated['reason'] ?? null, $request->user());

        return $this->success(null, 'Document deleted.');
    }

    public function expiryAlerts(Request $request, Partner $partner): JsonResponse
    {
        $onlyPending = $request->boolean('unacknowledged');

        return $this->success(
            DocumentManagementService::expiryAlerts($partner, $onlyPending),
            'Document expiry alerts loaded (BR-11).'
        );
    }

    public function acknowledgeAlert(Request $request, PartnerDocumentExpiry $alert): JsonResponse
    {
        return $this->success(
            DocumentManagementService::acknowledgeAlert($alert, $request->user()),
            'Expiry alert acknowledged.'
        );
    }

    public function globalExpiryDashboard(Request $request): JsonResponse
    {
        $query = PartnerDocumentExpiry::with([
            'document:id,document_id,document_name,category,document_type,expiry_date,status',
            'partner:id,partner_name,partner_code,partner_id',
        ])->where('alert_date', '<=', now()->toDateString());

        if ($level = $request->query('level')) {
            $query->where('level', $level);
        }
        if ($request->boolean('unacknowledged')) {
            $query->where('acknowledged', false);
        }

        $alerts = $query->orderByRaw("FIELD(level, 'Expired', 'Critical', 'Warning', 'Info')")
            ->orderBy('expiry_date')
            ->limit(200)
            ->get();

        return $this->success([
            'total_alerts'   => $alerts->count(),
            'unacknowledged' => $alerts->where('acknowledged', false)->count(),
            'expired'        => $alerts->where('level', 'Expired')->count(),
            'critical'       => $alerts->where('level', 'Critical')->count(),
            'warning'        => $alerts->where('level', 'Warning')->count(),
            'info'           => $alerts->where('level', 'Info')->count(),
            'alerts'         => $alerts,
        ], 'System-wide document expiry dashboard loaded.');
    }


    private function rules(bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        $allowedTypes = collect(DocumentManagementService::CATEGORIES)->flatten()->implode(',');

        return [
            'document_name'     => [$req, 'string', 'max:255'],
            'category'          => [$req, 'string', 'in:' . implode(',', array_keys(DocumentManagementService::CATEGORIES))],
            'document_type'     => [$req, 'string', 'in:' . $allowedTypes],
            'support_center_id' => ['nullable', 'integer', 'exists:partner_support_centers,id'],
            'version'           => ['nullable', 'string', 'max:20'],
            'status'            => ['nullable', 'string', 'in:' . implode(',', DocumentManagementService::STATUSES)],
            'effective_date'    => ['nullable', 'date'],
            'expiry_date'       => ['nullable', 'date', 'after_or_equal:effective_date'],
            'remarks'           => ['nullable', 'string', 'max:2000'],
            'change_notes'      => ['nullable', 'string', 'max:2000'],
            'file'              => ['nullable', 'file', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif', 'max:20480'],
        ];
    }


    private function present(PartnerDocument $document): PartnerDocument
    {
        $document->append(['days_to_expiry', 'is_expired', 'expiry_level']);
        $document->setAttribute('file_url', DocumentManagementService::fileUrl($document->file_path));

        return $document;
    }
}
