<?php

namespace App\Http\Requests;

use App\Models\InspectionItemResult;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInspectionItemResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var InspectionItemResult $result */
        $result = $this->route('result');
        $isSubmitted = $result->inspection->status === 'submitted';

        return [
            'result' => ['required', 'in:pass,fail,na'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'change_reason' => [$isSubmitted ? 'required' : 'nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'change_reason.required' => 'A reason is required when changing an item on an already-submitted inspection.',
        ];
    }
}
