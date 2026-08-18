<?php

namespace App\Http\Requests\AuthorRequest;

use Illuminate\Foundation\Http\FormRequest;

class RequestBookModificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'changes' => ['required', 'array', 'min:1'],
        ];
    }
}
