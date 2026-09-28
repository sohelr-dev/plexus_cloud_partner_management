<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\SystemAlertNotification;
use Illuminate\Support\Facades\Notification;

class NotificationService
{

    public static function notifyRoles(string|array $roles, SystemAlertNotification $notification): void
    {
        $roleList = is_array($roles) ? $roles : [$roles];
        
        $users = User::whereHas('roles', function ($query) use ($roleList) {
            $query->whereIn('name', array_merge($roleList, ['super-admin', 'system-admin']));
        })->get();

        if ($users->isNotEmpty()) {
            Notification::send($users, $notification);
        }
    }

    public static function notifyPartnerEvent(string $title, string $message, ?int $partnerId = null, string $severity = 'info'): void
    {
        $isApproval = str_contains(strtolower($title), 'approval') || str_contains(strtolower($title), 'approved') || str_contains(strtolower($title), 'rejected');
        $settingKey = $isApproval ? 'notify_partner_approval' : 'notify_contract_expiry';
        
        if (! (bool) \App\Models\Setting::get($settingKey, true)) {
            return;
        }

        $notification = new SystemAlertNotification(
            category: 'Partner',
            title: $title,
            message: $message,
            actionUrl: $partnerId ? "/partners/{$partnerId}" : "/partners",
            severity: $severity,
            partnerId: $partnerId
        );

        self::notifyRoles(['management', 'partner-manager'], $notification);
    }

    public static function notifyFinancialAlert(string $title, string $message, ?int $partnerId = null, string $severity = 'warning'): void
    {
        $isOverdue = str_contains(strtolower($title), 'overdue');
        $settingKey = $isOverdue ? 'notify_payment_overdue' : 'notify_credit_limit_exceeded';

        if (! (bool) \App\Models\Setting::get($settingKey, true)) {
            return;
        }

        $notification = new SystemAlertNotification(
            category: 'Finance',
            title: $title,
            message: $message,
            actionUrl: $partnerId ? "/partners/{$partnerId}" : "/dashboard",
            severity: $severity,
            partnerId: $partnerId
        );

        self::notifyRoles(['finance', 'accounts', 'management'], $notification);
    }

    public static function notifyBandwidthAlert(string $title, string $message, ?int $partnerId = null, string $severity = 'info'): void
    {
        if (! (bool) \App\Models\Setting::get('notify_bandwidth_high_utilization', true)) {
            return;
        }

        $notification = new SystemAlertNotification(
            category: 'Bandwidth',
            title: $title,
            message: $message,
            actionUrl: '/bandwidth',
            severity: $severity,
            partnerId: $partnerId
        );

        self::notifyRoles(['network', 'sales', 'management'], $notification);
    }

    public static function notifyEquipmentAlert(string $title, string $message, ?int $partnerId = null, string $severity = 'warning'): void
    {
        if (! (bool) \App\Models\Setting::get('notify_equipment_warranty_expiry', true)) {
            return;
        }

        $notification = new SystemAlertNotification(
            category: 'Equipment',
            title: $title,
            message: $message,
            actionUrl: $partnerId ? "/partners/{$partnerId}" : "/partners",
            severity: $severity,
            partnerId: $partnerId
        );

        self::notifyRoles(['inventory', 'network'], $notification);
    }

    public static function notifyCommissionAlert(string $title, string $message, ?int $partnerId = null, string $severity = 'info'): void
    {
        if (! (bool) \App\Models\Setting::get('notify_commission_pending_approval', true)) {
            return;
        }

        $notification = new SystemAlertNotification(
            category: 'Commission',
            title: $title,
            message: $message,
            actionUrl: '/commission',
            severity: $severity,
            partnerId: $partnerId
        );

        self::notifyRoles(['finance', 'accounts', 'management'], $notification);
    }

    public static function notifyHealthRiskAlert(string $title, string $message, ?int $partnerId = null, string $severity = 'danger'): void
    {
        if (! (bool) \App\Models\Setting::get('notify_health_score_declined', true)) {
            return;
        }

        $notification = new SystemAlertNotification(
            category: 'Health',
            title: $title,
            message: $message,
            actionUrl: $partnerId ? "/partners/{$partnerId}" : "/partners",
            severity: $severity,
            partnerId: $partnerId
        );

        self::notifyRoles(['management', 'partner-manager'], $notification);
    }

    public static function notifyDocumentAlert(string $title, string $message, ?int $partnerId = null, string $severity = 'warning'): void
    {
        if (! (bool) \App\Models\Setting::get('notify_document_expiry', true)) {
            return;
        }

        $notification = new SystemAlertNotification(
            category: 'Documents',
            title: $title,
            message: $message,
            actionUrl: $partnerId ? "/partners/{$partnerId}" : "/partners",
            severity: $severity,
            partnerId: $partnerId
        );

        self::notifyRoles(['partner-manager', 'sales'], $notification);
    }
}
