<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AiSuggestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'inspection_id' => $this->inspection_id,
            'suggestion_type' => $this->suggestion_type,
            'suggested_text' => $this->suggested_text,
            'status' => $this->status,
            'accepted_text' => $this->accepted_text,
            'reviewed_by' => $this->reviewedBy?->name,
            'created_at' => $this->created_at,
        ];
    }
}
