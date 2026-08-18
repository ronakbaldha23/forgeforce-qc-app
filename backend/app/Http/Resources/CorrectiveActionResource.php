<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CorrectiveActionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'defect_id' => $this->defect_id,
            'description' => $this->description,
            'assigned_to' => $this->when($this->assignee, fn () => [
                'id' => $this->assignee->id,
                'name' => $this->assignee->name,
            ]),
            'due_date' => $this->due_date?->toDateString(),
            'status' => $this->status,
            'completion_notes' => $this->completion_notes,
            'completed_at' => $this->completed_at,
            'created_by' => $this->createdBy?->name,
            'created_at' => $this->created_at,
        ];
    }
}
