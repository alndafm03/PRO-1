<?php

namespace App\Http\Requests\Search;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterBooksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'language' => ['sometimes', 'string', 'max:50'],
            'book_type' => ['sometimes', Rule::in(['physical', 'digital', 'both'])],
            'min_rating' => ['sometimes', 'numeric', 'min:0', 'max:5'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
