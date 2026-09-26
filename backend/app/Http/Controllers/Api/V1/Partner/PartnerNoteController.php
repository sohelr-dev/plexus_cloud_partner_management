<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Partner\Partner;
use App\Models\Partner\PartnerNote;
use App\Services\NotesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class PartnerNoteController extends ApiController
{
    public function index(Request $request, Partner $partner): JsonResponse
    {
        $filters = $request->only(['category', 'priority', 'visibility', 'search', 'date_from', 'date_to', 'per_page']);

        $paginator = NotesService::paginate($partner, $filters);

        return response()->json([
            'data' => collect($paginator->items())->map(fn($note) => $this->present($note)),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
                'summary'      => NotesService::summary($partner),
            ],
            'message' => 'Partner notes loaded.',
        ]);
    }

    public function store(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate($this->rules());

        $note = NotesService::create($partner, $validated, $request->file('attachment'), $request->user());

        return $this->success($this->present($note), 'Note added.', 201);
    }

    public function update(Request $request, PartnerNote $note): JsonResponse
    {
        $validated = $request->validate($this->rules(partial: true));

        $updated = NotesService::update($note, $validated, $request->file('attachment'), $request->user());

        return $this->success($this->present($updated), 'Note updated.');
    }

    public function togglePin(Request $request, PartnerNote $note): JsonResponse
    {
        return $this->success(
            $this->present(NotesService::togglePin($note, $request->user())),
            'Note pin toggled.'
        );
    }

    public function destroy(Request $request, PartnerNote $note): JsonResponse
    {
        NotesService::delete($note, $request->user());

        return $this->success(null, 'Note deleted.');
    }


    private function rules(bool $partial = false): array
    {
        return [
            'note'       => [$partial ? 'sometimes' : 'required', 'string', 'max:5000'],
            'category'   => ['nullable', 'string', 'in:' . implode(',', PartnerNote::CATEGORIES)],
            'priority'   => ['nullable', 'string', 'in:' . implode(',', PartnerNote::PRIORITIES)],
            'visibility' => ['nullable', 'string', 'in:' . implode(',', PartnerNote::VISIBILITIES)],
            'is_pinned'  => ['nullable', 'boolean'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,txt', 'max:10240'],
        ];
    }

    private function present(PartnerNote $note): PartnerNote
    {
        $note->setAttribute('created_by_name', $note->creator?->name);
        $note->setAttribute('attachment_url', NotesService::attachmentUrl($note->attachment_path));

        return $note;
    }
}
