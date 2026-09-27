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
