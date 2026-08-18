<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDefectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inspection_item_result_id' => ['required', 'integer', 'exists:inspection_item_results,id'],
            'description' => ['required', 'string', 'max:2000'],
            'severity' => ['required', 'in:minor,major,critical'],
        ];
    }
}
