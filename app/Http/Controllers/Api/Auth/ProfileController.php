<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Models\Borrowing;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * FR-03: عرض بيانات حساب المستخدم الحالي.
     */
    public function show(Request $request)
    {
        return response()->json(['data' => $request->user()->load('roles')]);
    }

    /**
     * FR-03: تعديل البيانات الشخصية (الاسم، الهاتف، البريد، تاريخ الميلاد...).
     */
    public function update(UpdateProfileRequest $request)
    {
        $request->user()->update($request->validated());

        return response()->json(['message' => 'تم تحديث البيانات بنجاح', 'data' => $request->user()->fresh()]);
    }

    /**
     * FR-03: رفع أو تغيير الصورة الشخصية.
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');
        $request->user()->update(['avatar' => $path]);

        return response()->json(['message' => 'تم تحديث الصورة الشخصية بنجاح', 'data' => $request->user()->fresh()]);
    }

    /**
     * FR-03: تغيير كلمة المرور للمستخدم (يتطلب كلمة المرور الحالية).
     */
    public function updatePassword(UpdatePasswordRequest $request)
    {
        $request->user()->update(['password' => Hash::make($request->validated('password'))]);

        return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح']);
    }

    /**
     * FR-04: حذف الحساب نهائيًا — بشرط عدم وجود التزامات نشطة (نفس تعريف
     * AdminUserController::hasActiveObligations لضمان اتساق القاعدة بين حذف المستخدم لنفسه وحذف الأدمن له).
     */
    public function destroy(Request $request)
    {
        $user = $request->user();

        if ($this->hasActiveObligations($user)) {
            return response()->json([
                'message' => 'لا يمكن حذف الحساب بسبب وجود التزامات نشطة (مبالغ مستحقة / غرامات غير مدفوعة / كتب ورقية لم تُعاد)',
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'تم حذف الحساب بنجاح']);
    }

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
