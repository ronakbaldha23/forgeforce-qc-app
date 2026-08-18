<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDefectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'string', 'max:2000'],
            'severity' => ['sometimes', 'in:minor,major,critical'],
            'status' => ['sometimes', 'in:open,in_progress,resolved,closed'],
        ];
    }
}
