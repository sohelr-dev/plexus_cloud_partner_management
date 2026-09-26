<?php

namespace App\Observers;

use App\Jobs\RecalculateHealthScoresJob;
use App\Models\Partner\Partner;
use App\Services\AuditLogService;


class PartnerObserver
{

    private const EXCLUDE = ['updated_at', 'created_at', 'deleted_at', 'health_score', 'health_status'];

    public function created(Partner $partner): void
    {
        AuditLogService::log(
            action: 'created',
            entity: $partner,
            oldValues: null,
            newValues: $this->clean($partner->getAttributes()),
        );
    }

    public function updated(Partner $partner): void
    {
        $dirty = $partner->getDirty();
        if (empty($dirty)) return;

        $changed = array_diff_key($dirty, array_flip(self::EXCLUDE));
        if (empty($changed)) return;

        $old = array_intersect_key($partner->getOriginal(), $changed);

        // Special handling — status change gets its own action label
        $action = isset($changed['status']) ? 'status_changed' : 'updated';

        AuditLogService::log(
            action:    $action,
            entity:    $partner,
            oldValues: $old,
            newValues: $changed,
        );

        if (isset($changed['status']) || isset($changed['credit_limit'])) {
            RecalculateHealthScoresJob::dispatch($partner);
        }
    }

    public function deleted(Partner $partner): void
    {
        AuditLogService::log(
            action: 'deleted',
            entity: $partner,
        );
    }

    public function restored(Partner $partner): void
    {
        AuditLogService::log(
            action: 'restored',
            entity: $partner,
        );
    }

    private function clean(array $attributes): array
    {
        return array_diff_key($attributes, array_flip(self::EXCLUDE));
    }
}
