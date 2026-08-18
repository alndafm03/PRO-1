<?php

namespace App\Http\Requests\WalkIn;

use Illuminate\Foundation\Http\FormRequest;

class CreateWalkInPurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'book_id' => ['required', 'integer', 'exists:books,id'],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ];
    }
}
