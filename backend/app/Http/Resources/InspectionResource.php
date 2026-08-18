<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InspectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'machine' => [
                'id' => $this->machine->id,
                'code' => $this->machine->code,
                'serial_number' => $this->machine->serial_number,
                'name' => $this->machine->name,
            ],
            'inspector' => $this->inspector?->name,
            'status' => $this->status,
            'started_at' => $this->started_at,
            'submitted_at' => $this->submitted_at,
            'item_results' => InspectionItemResultResource::collection($this->whenLoaded('itemResults')),
        ];
    }
}
