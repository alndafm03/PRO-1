<?php

namespace App\Http\Requests\AuthorRequest;

use Illuminate\Foundation\Http\FormRequest;

class ApplyAuthorRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bio' => ['nullable', 'string', 'max:5000'],
            'description' => ['nullable', 'string', 'max:5000'],
            'previous_works' => ['nullable', 'string', 'max:5000'],
            // FR-38: PDF فقط، حد أقصى 2 ملفات، حد أقصى 10 MB لكل ملف
            'work_pdfs' => ['nullable', 'array', 'max:2'],
            'work_pdfs.*' => ['file', 'mimes:pdf', 'max:10240'],
        ];
    }
}
