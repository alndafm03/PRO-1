<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => NotificationResource::collection($notifications)]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        $this->authorize('view', $notification);

        $notification->markAsRead();

        return response()->json([
            'message' => 'تم تحديد الإشعار كمقروء',
            'data' => new NotificationResource($notification),
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->unread()->update(['read_at' => now()]);

        return response()->json(['message' => 'تم تحديد جميع الإشعارات كمقروءة']);
    }
}
