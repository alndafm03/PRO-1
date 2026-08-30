<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEmployeeRequest;
use App\Http\Requests\Admin\UpdateEmployeeRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;

class AdminEmployeeController extends Controller
{
    private const EMPLOYEE_ROLES = ['library_employee', 'author_content_employee'];

    public function index(Request $request)
    {
        $employees = User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', self::EMPLOYEE_ROLES))
            ->with('roles')
            ->when($request->filled('type'), function ($q) use ($request) {
                $q->whereHas('roles', fn ($r) => $r->where('name', $request->string('type')));
            })
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => UserResource::collection($employees)]);
    }

    public function store(StoreEmployeeRequest $request)
    {
        $validated = $request->validated();

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
            'data' => new UserResource($user->load('roles')),
        ], 201);
    }

    public function update(UpdateEmployeeRequest $request, User $user)
    {
        if (! $user->roles()->whereIn('name', self::EMPLOYEE_ROLES)->exists()) {
            return response()->json(['message' => 'هذا المستخدم ليس موظفًا'], 404);
        }

        $validated = $request->validated();
        $user->update(collect($validated)->except('employee_type')->toArray());

        if (isset($validated['employee_type'])) {
            $newRole = Role::firstOrCreate(['name' => $validated['employee_type']]);
            $user->roles()->detach(
                Role::whereIn('name', self::EMPLOYEE_ROLES)->pluck('id')
            );
            $user->roles()->attach($newRole->id);
        }

        return response()->json(['message' => 'تم تحديث بيانات الموظف', 'data' => new UserResource($user->load('roles'))]);
    }

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
