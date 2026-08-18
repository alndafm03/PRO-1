<?php

namespace App\Http\Requests\LibraryEmployee;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCopyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // FR-65: الموظف يبدّل يدويًا بين هذه الحالات الثلاث فقط — borrowed/sold مُدارة
        // تلقائيًا من عمليات الشراء والإعارة، ما بتنضبط يدويًا هون.
        return [
            'status' => ['required', Rule::in(['available', 'damaged', 'lost'])],
        ];
    }
}
