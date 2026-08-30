<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public const EMPLOYEE_ROLES = ['library_employee', 'author_content_employee'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name'     => ['required', 'string', 'max:255'],
            'username'      => ['required', 'string', 'max:255', 'unique:users,username'],
            'phone'         => ['required', 'string', 'max:20', 'unique:users,phone'],
            'email'         => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'      => ['required', 'string', 'min:8'],
            'birthday'      => ['required', 'date', 'before:today'],
            'employee_type' => ['required', Rule::in(self::EMPLOYEE_ROLES)],
        ];
    }
}
