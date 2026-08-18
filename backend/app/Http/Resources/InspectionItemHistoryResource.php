<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InspectionItemHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'previous_result' => $this->previous_result,
            'new_result' => $this->new_result,
            'previous_comment' => $this->previous_comment,
            'new_comment' => $this->new_comment,
            'changed_by' => $this->changedBy?->name,
            'changed_at' => $this->changed_at,
            'change_reason' => $this->change_reason,
        ];
    }
}
