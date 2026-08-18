<?php

namespace App\Http\Requests\AuthorBook;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAuthorBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'cover_image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'publisher' => ['required', 'string', 'max:255'],
            'publisher_year' => ['nullable', 'integer', 'min:1400', 'max:' . (date('Y') + 1)],
            'language' => ['required', 'string', 'max:50'],
            'page_count' => ['nullable', 'integer', 'min:1'],
            'book_type' => ['required', Rule::in(['physical', 'digital', 'both'])],
            'price_physical' => ['required_if:book_type,physical,both', 'nullable', 'numeric', 'min:0'],
            'price_digital' => ['required_if:book_type,digital,both', 'nullable', 'numeric', 'min:0'],
            'digital_file' => ['required_if:book_type,digital,both', 'nullable', 'file', 'mimes:pdf', 'max:10240'],
            'category_ids' => ['required', 'array', 'min:1'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'sale_copies_count' => ['nullable', 'integer', 'min:0'],
            'borrow_copies_count' => ['nullable', 'integer', 'min:0'],
            'borrow_options' => ['nullable', 'array'],
            'borrow_options.*.duration_days' => ['required_with:borrow_options', 'integer', 'min:1'],
            'borrow_options.*.physical_price' => ['nullable', 'numeric', 'min:0'],
            'borrow_options.*.digital_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
