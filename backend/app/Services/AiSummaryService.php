<?php

namespace App\Services;

use App\Models\AiSuggestion;
use App\Models\Inspection;
use App\Services\Ai\DefectSummaryGenerator;

class AiSummaryService
{
    public function __construct(private DefectSummaryGenerator $generator) {}

    /**
     * Generate a defect summary for an inspection's failed items and store it
     * as a pending, advisory-only suggestion. Never writes to defects or any
     * other official record — a human must explicitly review it separately.
     */
    public function generateForInspection(Inspection $inspection): AiSuggestion
    {
        $findings = $this->buildFindings($inspection);
        $summary = $this->generator->summarize($findings);

        return AiSuggestion::create([
            'inspection_id' => $inspection->id,
            'suggestion_type' => 'defect_summary',
            'input_snapshot' => $findings,
            'suggested_text' => $summary,
            'status' => 'pending',
        ]);
    }

    private function buildFindings(Inspection $inspection): array
    {
        $inspection->loadMissing(['machine', 'itemResults.templateItem', 'itemResults.defects']);

        $failedItems = $inspection->itemResults
            ->where('result', 'fail')
            ->map(fn ($item) => [
                'label' => $item->templateItem->label,
                'comment' => $item->comment,
                'defects' => $item->defects->map(fn ($defect) => [
                    'description' => $defect->description,
                    'severity' => $defect->severity,
                ])->values()->all(),
            ])
            ->values()
            ->all();

        return [
            'machine' => [
                'name' => $inspection->machine->name,
                'code' => $inspection->machine->code,
                'serial_number' => $inspection->machine->serial_number,
            ],
            'failed_items' => $failedItems,
        ];
    }
}
