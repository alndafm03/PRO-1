<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public const EMPLOYEE_ROLES = ['library_employee', 'author_content_employee'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'full_name'     => ['sometimes', 'string', 'max:255'],
            'phone'         => ['sometimes', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($userId)],
            'email'         => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'employee_type' => ['sometimes', Rule::in(self::EMPLOYEE_ROLES)],
        ];
    }
}
