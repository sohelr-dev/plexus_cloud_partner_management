<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Database\Eloquent\Model;

/**
 * AuditLogService — central service for logging any change.
 *
 * Usage (in any controller / observer):
 *   AuditLogService::log('updated', $partner, $oldValues, $newValues);
 *   AuditLogService::log('status_changed', $partner, ['status' => 'Active'], ['status' => 'Suspended']);
 *   AuditLogService::log('approved', $commission, null, null, 'Approved by Finance');
 */
class AuditLogService
{
    /**
     * Record an audit entry.
     *
     * @param string     $action      e.g. created|updated|deleted|status_changed|approved|...
     * @param Model      $entity      The Eloquent model that changed
     * @param array|null $oldValues   The previous state (only changed fields)
     * @param array|null $newValues   The new state (only changed fields)
     * @param string|null $reason     Optional reason (approval comments, reversal notes)
     */
    public static function log(
        string  $action,
        Model   $entity,
        ?array  $oldValues = null,
        ?array  $newValues = null,
        ?string $reason    = null,
    ): AuditLog {
        $user = Auth::user();

        return AuditLog::create([
            'user_id'      => $user?->id,
            'user_name'    => $user?->name,
            'action'       => $action,
            'entity_type'  => class_basename($entity),
            'entity_id'    => $entity->getKey(),
            'entity_label' => static::resolveLabel($entity),
            'old_values'   => $oldValues,
            'new_values'   => $newValues,
            'ip_address'   => Request::ip(),
            'user_agent'   => substr((string) Request::userAgent(), 0, 500),
            'reason'       => $reason,
        ]);
    }

    /**
     * Compute a human-readable label for the entity snapshot.
     * Extend this for any new entity type.
     */
    private static function resolveLabel(Model $entity): ?string
    {
        return match (class_basename($entity)) {
            'Partner'            => data_get($entity, 'partner_name'),
            'PartnerCommission'  => 'Commission #' . $entity->getKey(),
            'BandwidthAllocation'=> 'BW Alloc #' . $entity->getKey(),
            'SupportCenter'      => data_get($entity, 'branch_name'),
            'User'               => data_get($entity, 'name'),
            default              => null,
        };
    }
}
