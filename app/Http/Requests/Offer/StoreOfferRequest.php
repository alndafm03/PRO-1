<?php

namespace App\Http\Requests\Offer;

use Illuminate\Foundation\Http\FormRequest;

class StoreOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'discount_percent' => ['required', 'integer', 'min:1', 'max:100'],
            'starts_at'        => ['nullable', 'date'],
            'ends_at'          => ['nullable', 'date', 'after_or_equal:starts_at'],
            'active'           => ['sometimes', 'boolean'],
            'book_ids'         => ['required', 'array', 'min:1'],
            'book_ids.*'       => ['exists:books,id'],
        ];
    }
}
