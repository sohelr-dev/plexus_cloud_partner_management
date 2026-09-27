<?php

namespace Database\Seeders;

use App\Models\Partner\Partner;
use App\Models\User;
use App\Notifications\SystemAlertNotification;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) {
            return;
        }

        $samplePartner = Partner::first();
        $partnerId = $samplePartner?->id;

        $sampleAlerts = [
            [
                'category'   => 'Bandwidth',
                'title'      => 'High Utilization Alert',
                'message'    => 'Partner bandwidth utilization exceeded 85% peak threshold for 3 consecutive days.',
                'action_url' => '/bandwidth',
                'severity'   => 'warning',
            ],
            [
                'category'   => 'Finance',
                'title'      => 'Payment Overdue Notice',
                'message'    => 'Invoice #INV-2026-089 has exceeded the credit grace period of 30 days.',
                'action_url' => $partnerId ? "/partners/{$partnerId}" : "/dashboard",
                'severity'   => 'danger',
            ],
            [
                'category'   => 'Health',
                'title'      => 'Health Score Downgraded',
                'message'    => 'Partner health score declined to "Risk" category due to customer churn increase.',
                'action_url' => $partnerId ? "/partners/{$partnerId}" : "/partners",
                'severity'   => 'danger',
            ],
            [
                'category'   => 'Equipment',
                'title'      => 'Equipment Warranty Nearing Expiry',
                'message'    => '2 OLT core modules warranty will expire in less than 30 days. Replacement recommended.',
                'action_url' => $partnerId ? "/partners/{$partnerId}" : "/partners",
                'severity'   => 'warning',
            ],
            [
                'category'   => 'Partner',
                'title'      => 'New Partner Approved',
                'message'    => 'Commercial agreement signed and partner status updated to Active.',
                'action_url' => $partnerId ? "/partners/{$partnerId}" : "/partners",
                'severity'   => 'success',
            ],
        ];

        foreach ($sampleAlerts as $alert) {
            $notification = new SystemAlertNotification(
                category: $alert['category'],
                title: $alert['title'],
                message: $alert['message'],
                actionUrl: $alert['action_url'],
                severity: $alert['severity'],
                partnerId: $partnerId
            );

            foreach ($users as $user) {
                $user->notify($notification);
            }
        }
    }
}
