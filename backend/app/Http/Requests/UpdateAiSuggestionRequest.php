<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAiSuggestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:accepted,edited,rejected'],
            'accepted_text' => ['nullable', 'string', 'max:4000', 'required_if:status,edited'],
        ];
    }
}
