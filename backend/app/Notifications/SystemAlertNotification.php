<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SystemAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $category,       // Partner, Finance, Bandwidth, Equipment, Commission, SupportCenter, Documents, Health
        public string $title,
        public string $message,
        public ?string $actionUrl = null,
        public string $severity = 'info', // info, warning, danger, success
        public ?int $partnerId = null,
        public array $metadata = []
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'category'   => $this->category,
            'title'      => $this->title,
            'message'    => $this->message,
            'action_url' => $this->actionUrl,
            'severity'   => $this->severity,
            'partner_id' => $this->partnerId,
            'metadata'   => $this->metadata,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
