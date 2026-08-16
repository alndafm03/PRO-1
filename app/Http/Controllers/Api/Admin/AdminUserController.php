<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    //عرض كافة المستخدمين المسجلين (عدا حساب النظام Walk-in Customer)
    public function index(Request $request)
    {
        $users = User::query()
            ->where('is_system_account', false)
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('role'), function ($q) use ($request) {
                $q->whereHas('roles', fn ($r) => $r->where('name', $request->string('role')));
            })
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where(function ($sub) use ($search) {
                    $sub->where('full_name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->with('roles')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $users]);
    }

    //عرض بيانات مستخدم محدد
    public function show(User $user)
    {
        $user->load('roles');

        return response()->json([
            'data' => [
                'user' => $user,
                'has_active_obligations' => $this->hasActiveObligations($user),
            ],
        ]);
    }

    //تعطيل حساب مستخدم
    public function disable(User $user)
    {
        if ($user->is_system_account) {
            return response()->json(['message' => 'لا يمكن تعطيل هذا الحساب'], 422);
        }

        $user->update(['status' => 'disabled']);

        return response()->json(['message' => 'تم تعطيل الحساب بنجاح', 'data' => $user]);
    }

    // تفعيل حساب مستخدم
    public function enable(User $user)
    {
        $user->update(['status' => 'active']);

        return response()->json(['message' => 'تم تفعيل الحساب بنجاح', 'data' => $user]);
    }

    //حذف حساب مستخدم نهائي
    public function destroy(User $user)
    {
        if ($user->is_system_account) {
            return response()->json(['message' => 'لا يمكن حذف هذا الحساب'], 422);
        }

        if ($this->hasActiveObligations($user)) {
            return response()->json([
                'message' => 'لا يمكن حذف الحساب بسبب وجود التزامات نشطة (مبالغ مستحقة / غرامات غير مدفوعة / كتب ورقية لم تُعاد)',
            ], 422);
        }

        $user->delete();

        return response()->json(['message' => 'تم حذف الحساب بنجاح']);
    }

    //تحقق من وجود التزامات نشطة تمنع حذف الحساب
    private function hasActiveObligations(User $user): bool
    {
        $unpaidFines = Borrowing::where('user_id', $user->id)
            ->where('fine_amount', '>', 0)
            ->where('fine_paid', false)
            ->exists();

        $unreturnedPhysicalBooks = Borrowing::where('user_id', $user->id)
            ->where('book_type', 'physical')
            ->where('status', 'active')
            ->exists();

        $pendingDues = Order::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        return $unpaidFines || $unreturnedPhysicalBooks || $pendingDues;
    }
}
