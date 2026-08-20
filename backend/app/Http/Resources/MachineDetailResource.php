<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MachineDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'serial_number' => $this->serial_number,
            'name' => $this->name,
            'location' => $this->location,
            'machine_type' => [
                'id' => $this->machineType->id,
                'name' => $this->machineType->name,
            ],
            'draft_inspection' => $this->when(
                $this->relationLoaded('inspections'),
                fn () => optional(
                    $this->inspections->firstWhere('status', 'draft'),
                    fn ($inspection) => ['id' => $inspection->id, 'started_at' => $inspection->started_at]
                ),
            ),
        ];
    }
}
