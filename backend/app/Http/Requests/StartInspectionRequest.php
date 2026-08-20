<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'machine_id' => ['required', 'integer', 'exists:machines,id'],
        ];
    }
}
