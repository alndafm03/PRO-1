<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * FR-73: عرض قائمة جميع الإشعارات الواردة للمستخدم (الأحدث أولًا).
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $notifications]);
    }

    /**
     * FR-73: تحديد إشعار محدد كـ "تمت القراءة".
     */
    public function markAsRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403, 'هذا الإشعار لا يخصك');
        }

        $notification->markAsRead();

        return response()->json(['message' => 'تم تحديد الإشعار كمقروء', 'data' => $notification]);
    }

    /**
     * FR-73: تحديد كافة الإشعارات كـ "تمت القراءة".
     */
    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->unread()->update(['read_at' => now()]);

        return response()->json(['message' => 'تم تحديد جميع الإشعارات كمقروءة']);
    }
}
