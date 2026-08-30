<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class NotificationPolicy
{
    public function view(User $user, Notification $notification): Response
    {
        return $user->id === $notification->user_id
            ? Response::allow()
            : Response::deny('هذا الإشعار لا يخصك');
    }
}
