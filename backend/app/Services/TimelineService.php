<?php

namespace App\Services;

use App\Models\Partner\Partner;
use App\Models\Partner\PartnerTimelineEvent;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;


class TimelineService
{

    public static function record(
        Partner $partner,
        string $eventType,
        string $module,
        ?string $title = null,
        ?string $description = null,
        array $options = [],
    ): PartnerTimelineEvent {
        $actor = $options['performed_by'] ?? auth()->user();

        return PartnerTimelineEvent::create([
            'partner_id'      => $partner->id,
            'event_type'      => $eventType,
            'module'          => $module,
            'title'           => $title ?: $eventType,
            'description'     => $description,
            'severity'        => $options['severity'] ?? 'Info',
            'reference_type'  => $options['reference_type'] ?? null,
            'reference_id'    => $options['reference_id'] ?? null,
            'reference_label' => $options['reference_label'] ?? null,
            'meta'            => $options['meta'] ?? null,
            'performed_by'    => $actor?->id,
            'event_date'      => $options['event_date'] ?? now(),
        ]);
    }


    public static function recordForModel(
        Model $entity,
        string $eventType,
        ?string $module = null,
        ?string $title = null,
        ?string $description = null,
        array $options = [],
    ): ?PartnerTimelineEvent {
        $partner = self::resolvePartner($entity);

        if (! $partner) {
            return null;
        }

        $options['reference_type'] = $options['reference_type'] ?? class_basename($entity);
        $options['reference_id']   = $options['reference_id'] ?? $entity->getKey();

        return self::record(
            $partner,
            $eventType,
            $module ?? ($options['module'] ?? 'System'),
            $title,
            $description,
            $options,
        );
    }

    public static function paginate(Partner $partner, array $filters = []): LengthAwarePaginator
    {
        return self::query($partner, $filters)
            ->with('performedBy:id,name')
            ->orderByDesc('event_date')
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 25));
    }


    public static function query(Partner $partner, array $filters = []): Builder
    {
        $query = PartnerTimelineEvent::query()->where('partner_id', $partner->id);

        if (! empty($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        if (! empty($filters['event_type'])) {
            $query->where('event_type', $filters['event_type']);
        }

        if (! empty($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }

        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(function (Builder $q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhere('event_type', 'like', "%{$term}%")
                    ->orWhere('reference_label', 'like', "%{$term}%");
            });
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('event_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('event_date', '<=', $filters['date_to']);
        }

        return $query;
    }


    public static function summary(Partner $partner): array
    {
        $counts = PartnerTimelineEvent::query()
            ->where('partner_id', $partner->id)
            ->selectRaw('module, COUNT(*) as total')
            ->groupBy('module')
            ->pluck('total', 'module');

        return [
            'total_events'   => (int) $counts->sum(),
            'by_module'      => $counts,
            'first_event_at' => PartnerTimelineEvent::where('partner_id', $partner->id)->min('event_date'),
            'last_event_at'  => PartnerTimelineEvent::where('partner_id', $partner->id)->max('event_date'),
        ];
    }

    public static function eventTypes(Partner $partner): array
    {
        return PartnerTimelineEvent::query()
            ->where('partner_id', $partner->id)
            ->distinct()
            ->orderBy('event_type')
            ->pluck('event_type')
            ->all();
    }


    private static function resolvePartner(Model $entity): ?Partner
    {
        if ($entity instanceof Partner) {
            return $entity;
        }

        if (method_exists($entity, 'partner')) {
            return $entity->partner;
        }

        if (isset($entity->partner_id)) {
            return Partner::find($entity->partner_id);
        }

        return null;
    }
}
