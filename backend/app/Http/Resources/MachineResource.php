<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MachineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'serial_number' => $this->serial_number,
            'name' => $this->name,
            'location' => $this->location,
            'machine_type' => $this->machineType?->name,
        ];
    }
}
