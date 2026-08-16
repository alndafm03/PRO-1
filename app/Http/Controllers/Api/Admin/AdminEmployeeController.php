<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminEmployeeController extends Controller
{
    private const EMPLOYEE_ROLES = ['library_employee', 'author_content_employee'];

    //عرض قائمة الموظفين
    public function index(Request $request)
    {
        $employees = User::query()
            ->whereHas('roles', fn($q) => $q->whereIn('name', self::EMPLOYEE_ROLES))
            ->with('roles')
            ->when($request->filled('type'), function ($q) use ($request) {
                $q->whereHas('roles', fn($r) => $r->where('name', $request->string('type')));
            })
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $employees]);
    }

    //إضافة موظف جديد وتحديد نوعه
    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name'     => ['required', 'string', 'max:255'],
            'username'      => ['required', 'string', 'max:255', 'unique:users,username'],
            'phone'         => ['required', 'string', 'max:20', 'unique:users,phone'],
            'email'         => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'      => ['required', 'string', 'min:8'],
            'birthday'      => ['required', 'date', 'before:today'],
            'employee_type' => ['required', Rule::in(self::EMPLOYEE_ROLES)],
        ]);

        $user = User::create([
            'full_name' => $validated['full_name'],
            'username'  => $validated['username'],
            'phone'     => $validated['phone'],
            'email'     => $validated['email'],
            'password'  => $validated['password'],
            'birthday'  => $validated['birthday'],
            'status'    => 'active',
        ]);

        $role = Role::firstOrCreate(['name' => $validated['employee_type']]);
        $user->roles()->attach($role->id);

        return response()->json([
            'message' => 'تم إضافة الموظف بنجاح',
            'data' => $user->load('roles'),
        ], 201);
    }

    //تعديل بيانات وصلاحيات موظف
    public function update(Request $request, User $user)
    {
        if (! $user->roles()->whereIn('name', self::EMPLOYEE_ROLES)->exists()) {
            return response()->json(['message' => 'هذا المستخدم ليس موظفًا'], 404);
        }

        $validated = $request->validate([
            'full_name'     => ['sometimes', 'string', 'max:255'],
            'phone'         => ['sometimes', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
            'email'         => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'employee_type' => ['sometimes', Rule::in(self::EMPLOYEE_ROLES)],
        ]);

        $user->update(collect($validated)->except('employee_type')->toArray());

        if (isset($validated['employee_type'])) {
            $newRole = Role::firstOrCreate(['name' => $validated['employee_type']]);
            $user->roles()->detach(
                Role::whereIn('name', self::EMPLOYEE_ROLES)->pluck('id')
            );
            $user->roles()->attach($newRole->id);
        }

        return response()->json(['message' => 'تم تحديث بيانات الموظف', 'data' => $user->load('roles')]);
    }

    // حذف حساب موظف

    public function destroy(User $user)
    {
        if (! $user->roles()->whereIn('name', self::EMPLOYEE_ROLES)->exists()) {
            return response()->json(['message' => 'هذا المستخدم ليس موظفًا'], 404);
        }

        $user->roles()->detach();
        $user->delete();

        return response()->json(['message' => 'تم حذف الموظف بنجاح']);
    }
}
