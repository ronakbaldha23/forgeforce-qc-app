<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InspectionSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $itemResults = $this->whenLoaded('itemResults', fn () => $this->itemResults, collect());

        return [
            'id' => $this->id,
            'inspector' => $this->inspector?->name,
            'status' => $this->status,
            'started_at' => $this->started_at,
            'submitted_at' => $this->submitted_at,
            'fail_count' => $this->when(
                $this->relationLoaded('itemResults'),
                fn () => $itemResults->where('result', 'fail')->count(),
            ),
            'defect_count' => $this->when(
                $this->relationLoaded('itemResults'),
                fn () => $itemResults->flatMap(fn ($item) => $item->defects)->count(),
            ),
        ];
    }
}
