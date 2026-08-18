<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'book_id' => ['required', 'integer', 'exists:books,id'],
            'type' => ['required', Rule::in(['physical', 'digital'])],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ];
    }
}
