<?php

namespace App\Services;

use App\Models\Inspection;
use App\Models\Machine;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InspectionService
{
    /**
     * Start a new draft inspection using the machine type's active template,
     * pre-creating one (empty) result row per checklist item so the
     * checklist can be rendered immediately.
     */
    public function start(Machine $machine, User $inspector): Inspection
    {
        $template = $machine->machineType
            ->inspectionTemplates()
            ->where('is_active', true)
            ->latest('version')
            ->firstOrFail();

        return DB::transaction(function () use ($machine, $inspector, $template) {
            $inspection = Inspection::create([
                'machine_id' => $machine->id,
                'inspection_template_id' => $template->id,
                'inspector_id' => $inspector->id,
                'status' => 'draft',
                'started_at' => now(),
            ]);

            foreach ($template->items as $item) {
                $inspection->itemResults()->create([
                    'inspection_template_item_id' => $item->id,
                ]);
            }

            return $inspection;
        });
    }

    /**
     * Submit an inspection. Every checklist item must have a recorded
     * result (Pass/Fail/N/A) before submission is allowed.
     */
    public function submit(Inspection $inspection): Inspection
    {
        $unresolved = $inspection->itemResults()->whereNull('result')->with('templateItem')->get();

        if ($unresolved->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items' => [
                    'All checklist items must be marked Pass, Fail, or N/A before submitting. Missing: '
                        .$unresolved->pluck('templateItem.label')->join(', '),
                ],
            ]);
        }

        $inspection->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return $inspection;
    }
}
