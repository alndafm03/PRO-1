<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateAvatarRequest;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\Borrowing;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('roles');

        return response()->json(['data' => new UserResource($user)]);
    }

    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'message' => 'تم تحديث البيانات بنجاح',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function updateAvatar(UpdateAvatarRequest $request)
    {
        $path = $request->file('avatar')->store('avatars', 'public');
        $user = $request->user();
        $user->update(['avatar' => $path]);

        return response()->json([
            'message' => 'تم تحديث الصورة الشخصية بنجاح',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request)
    {
        $request->user()->update(['password' => Hash::make($request->validated('password'))]);

        return response()->json(['message' => 'تم تغيير كلمة المرور بنجاح']);
    }

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
