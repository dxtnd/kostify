<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FirebaseNotificationService
{
    protected $messaging;

    public function __construct()
    {
        $factory = (new Factory)
            ->withServiceAccount(
                config('firebase.credentials.file')
            );

        $this->messaging = $factory->createMessaging();
    }

    public function sendToToken(
        string $token,
        string $title,
        string $body
    ): void {
        $notification = Notification::create(
            $title,
            $body
        );

        $message = CloudMessage::withTarget('token', $token)
            ->withNotification($notification);

        $this->messaging->send($message);
    }
}