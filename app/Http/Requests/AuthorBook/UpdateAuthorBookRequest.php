<?php

namespace App\Http\Requests\AuthorBook;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAuthorBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'cover_image' => ['sometimes', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'publisher' => ['sometimes', 'string', 'max:255'],
            'publisher_year' => ['sometimes', 'nullable', 'integer', 'min:1400', 'max:' . (date('Y') + 1)],
            'language' => ['sometimes', 'string', 'max:50'],
            'page_count' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'book_type' => ['sometimes', Rule::in(['physical', 'digital', 'both'])],
            'price_physical' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'price_digital' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'digital_file' => ['sometimes', 'file', 'mimes:pdf', 'max:10240'],
            'category_ids' => ['sometimes', 'array', 'min:1'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'sale_copies_count' => ['sometimes', 'integer', 'min:0'],
            'borrow_copies_count' => ['sometimes', 'integer', 'min:0'],
            'borrow_options' => ['sometimes', 'array'],
            'borrow_options.*.duration_days' => ['required_with:borrow_options', 'integer', 'min:1'],
            'borrow_options.*.physical_price' => ['nullable', 'numeric', 'min:0'],
            'borrow_options.*.digital_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
