<?php

namespace App\Http\Requests\AuthorContentEmployee;

use Illuminate\Foundation\Http\FormRequest;

class RejectBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // FR-44: سبب الرفض غير إلزامي.
        return [
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
