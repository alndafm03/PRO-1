<?php

namespace App\Http\Requests\LibraryEmployee;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddCopyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'purpose' => ['required', Rule::in(['sale', 'borrowing'])],
            'copy_code' => ['nullable', 'string', 'max:100', 'unique:physical_copies,copy_code'],
        ];
    }
}
