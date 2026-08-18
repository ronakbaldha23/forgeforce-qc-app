<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCorrectiveActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'string', 'max:2000'],
            'assigned_to' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'in:pending,in_progress,completed,verified'],
            'completion_notes' => [
                'nullable', 'string', 'max:2000',
                'required_if:status,completed,verified',
            ],
        ];
    }
}
