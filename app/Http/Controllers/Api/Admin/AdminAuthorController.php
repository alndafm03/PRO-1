<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Author_request;
use App\Models\Notification;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;

class AdminAuthorController extends Controller
{
    public function index(Request $request)
    {
        $authors = User::query()
            ->whereHas('roles', function ($query) {
                $query->where('name', 'author');
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $authors]);
    }
    //الطلبات المعتمدة مبدئيًا من موظف المحتوى بانتظار قرار الأدمن
    public function preApprovedRequests(Request $request)
    {
        $requests = Author_request::query()
            ->upgrade()
            ->where('status', 'pre_approved')
            ->with(['user', 'reviewedBy'])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $requests]);
    }

    //الموافقة النهائية على طلب مؤلف وترقية حسابه
    public function approve(Request $request, Author_request $authorRequest)
    {
        if (! $authorRequest->isUpgrade() || $authorRequest->status !== 'pre_approved') {
            return response()->json(['message' => 'هذا الطلب غير قابل للموافقة النهائية حاليًا'], 422);
        }

        $authorRequest->update([
            'status'     => 'approved',
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);

        $authorRole = Role::firstOrCreate(['name' => 'author']);
        $authorRequest->user->roles()->syncWithoutDetaching([$authorRole->id]);

        // ADDED by project owner (not original teammate code) — إشعار FR-73 "Important Request Update"
        Notification::notify($authorRequest->user_id, 'request_update', [
            'request_id' => $authorRequest->id,
            'request_type' => 'author_upgrade',
            'decision' => 'approved',
        ]);

        return response()->json(['message' => 'تمت الموافقة على المؤلف بنجاح', 'data' => $authorRequest]);
    }

    //رفض الطلب
    public function reject(Request $request, Author_request $authorRequest)
    {
        if (! $authorRequest->isUpgrade() || $authorRequest->status !== 'pre_approved') {
            return response()->json(['message' => 'هذا الطلب غير قابل للرفض حاليًا'], 422);
        }

        $authorRequest->update([
            'status'     => 'rejected_by_admin',
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);

        // ADDED by project owner (not original teammate code) — إشعار FR-73 "Important Request Update"
        Notification::notify($authorRequest->user_id, 'request_update', [
            'request_id' => $authorRequest->id,
            'request_type' => 'author_upgrade',
            'decision' => 'rejected',
        ]);

        return response()->json(['message' => 'تم رفض الطلب', 'data' => $authorRequest]);
    }

    //تعطيل حساب مؤلفة شقرا
    public function disableAuthor(User $user)
    {
        if (! $user->isAuthor()) {
            return response()->json(['message' => 'هذا المستخدم ليس مؤلفًا'], 404);
        }

        $user->update(['status' => 'disabled']);

        return response()->json(['message' => 'تم تعطيل حساب المؤلف بنجاح', 'data' => $user]);
    }

    //تفعيل حساب معطل
    public function enableAuthor(User $user)
    {
        if (! $user->isAuthor()) {
            return response()->json(['message' => 'هذا المستخدم ليس مؤلفًا'], 404);
        }

        $user->update(['status' => 'active']);

        return response()->json(['message' => 'تم تفعيل حساب المؤلف بنجاح', 'data' => $user]);
    }
}
