<?php

namespace App\Http\Requests\LibraryEmployee;

use Illuminate\Foundation\Http\FormRequest;

class RegisterReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'is_damaged' => ['sometimes', 'boolean'],
        ];
    }
}
