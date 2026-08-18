<?php

namespace App\Http\Requests\AuthorContentEmployee;

use Illuminate\Foundation\Http\FormRequest;

class RequestBookChangesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
