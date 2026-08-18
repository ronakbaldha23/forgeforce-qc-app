<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DefectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'inspection_item_result_id' => $this->inspection_item_result_id,
            'description' => $this->description,
            'severity' => $this->severity,
            'status' => $this->status,
            'created_by' => $this->createdBy?->name,
            'created_at' => $this->created_at,
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            'corrective_actions' => CorrectiveActionResource::collection($this->whenLoaded('correctiveActions')),
        ];
    }
}
