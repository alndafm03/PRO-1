<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    //تسجيل حساب
    public function register(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:255', 'unique:users,username'],
            'phone'     => ['required', 'string', 'max:20', 'unique:users,phone'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:8', 'confirmed'],
            'birthday'  => ['required', 'date', 'before:today'],
            'avatar'    => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user = User::create([
            'full_name' => $validated['full_name'],
            'username'  => $validated['username'],
            'phone'     => $validated['phone'],
            'email'     => $validated['email'],
            'password'  => $validated['password'],
            'birthday'  => $validated['birthday'],
            'avatar'    => $validated['avatar'] ?? null,
            'status'    => 'active',
        ]);

        $readerRole = Role::firstOrCreate(['name' => 'reader']);
        $user->roles()->attach($readerRole->id);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'تم إنشاء الحساب بنجاح',
            'data' => [
                'user'  => $user->load('roles'),
                'token' => $token,
            ],
        ], 201);
    }

    //تسجيل الدخول
    public function login(Request $request)
    {
        $validated = $request->validate([
            'login'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['login'])
            ->orWhere('username', $validated['login'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'بيانات الدخول غير صحيحة',
            ], 401);
        }

        if ($user->status === 'disabled') {
            return response()->json([
                'message' => 'هذا الحساب معطّل، يرجى التواصل مع إدارة المكتبة',
            ], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'تم تسجيل الدخول بنجاح',
            'data' => [
                'user'  => $user->load('roles'),
                'token' => $token,
            ],
        ]);
    }

    //تسجيل الخروج
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }
}
