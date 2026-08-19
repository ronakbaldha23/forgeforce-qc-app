<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InspectionItemResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'inspection_id' => $this->inspection_id,
            'template_item' => [
                'id' => $this->templateItem->id,
                'label' => $this->templateItem->label,
                'help_text' => $this->templateItem->help_text,
                'sort_order' => $this->templateItem->sort_order,
            ],
            'result' => $this->result,
            'comment' => $this->comment,
            'updated_by' => $this->updatedBy?->name,
            'updated_at' => $this->updated_at,
            'defects' => DefectResource::collection($this->whenLoaded('defects')),
        ];
    }
}
