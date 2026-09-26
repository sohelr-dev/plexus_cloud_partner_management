<?php

namespace App\Http\Controllers\Api\V1\Partner;

use App\Http\Controllers\Api\V1\ApiController;
use App\Models\Partner\Partner;
use App\Services\TimelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class PartnerHistoryController extends ApiController
{
    public function index(Request $request, Partner $partner): JsonResponse
    {
        $filters = $request->only(['module', 'event_type', 'severity', 'search', 'date_from', 'date_to', 'per_page']);

        $paginator = TimelineService::paginate($partner, $filters);

        return response()->json([
            'data' => collect($paginator->items())->map(fn($event) => [
                'id'              => $event->id,
                'event_type'      => $event->event_type,
                'module'          => $event->module,
                'title'           => $event->title,
                'description'     => $event->description,
                'severity'        => $event->severity,
                'reference_type'  => $event->reference_type,
                'reference_id'    => $event->reference_id,
                'reference_label' => $event->reference_label,
                'meta'            => $event->meta,
                'performed_by'    => $event->performedBy?->name,
                'event_date'      => $event->event_date?->toDateTimeString(),
            ]),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
                'summary'      => TimelineService::summary($partner),
                'modules'      => \App\Models\Partner\PartnerTimelineEvent::MODULES,
                'event_types'  => TimelineService::eventTypes($partner),
            ],
            'message' => 'Partner history loaded.',
        ]);
    }

    public function summary(Partner $partner): JsonResponse
    {
        return $this->success([
            'summary'     => TimelineService::summary($partner),
            'modules'     => \App\Models\Partner\PartnerTimelineEvent::MODULES,
            'event_types' => TimelineService::eventTypes($partner),
        ], 'History summary loaded.');
    }


    public function store(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'event_type'  => ['required', 'string', 'max:100'],
            'module'      => ['required', 'string', 'in:' . implode(',', \App\Models\Partner\PartnerTimelineEvent::MODULES)],
            'title'       => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'severity'    => ['nullable', 'string', 'in:Info,Success,Warning,Danger'],
            'event_date'  => ['nullable', 'date'],
        ]);

        $event = TimelineService::record(
            $partner,
            $validated['event_type'],
            $validated['module'],
            $validated['title'] ?? null,
            $validated['description'] ?? null,
            [
                'severity'     => $validated['severity'] ?? 'Info',
                'event_date'   => $validated['event_date'] ?? now(),
                'performed_by' => $request->user(),
            ]
        );

        return $this->success($event->load('performedBy:id,name'), 'History event recorded.', 201);
    }
}
