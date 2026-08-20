<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartInspectionRequest;
use App\Http\Resources\InspectionResource;
use App\Models\Inspection;
use App\Models\Machine;
use App\Services\InspectionService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InspectionController extends Controller
{
    public function __construct(private InspectionService $inspections) {}

    public function store(StartInspectionRequest $request)
    {
        $machine = Machine::with('machineType')->findOrFail($request->validated('machine_id'));

        $inspection = $this->inspections->start($machine, $request->user());

        $inspection->load($this->detailRelations());

        return (new InspectionResource($inspection))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Inspection $inspection)
    {
        $inspection->load($this->detailRelations());

        return new InspectionResource($inspection);
    }

    public function submit(Inspection $inspection)
    {
        abort_if($inspection->status === 'submitted', Response::HTTP_CONFLICT, 'Inspection already submitted.');

        $inspection = $this->inspections->submit($inspection);

        $inspection->load($this->detailRelations());

        return new InspectionResource($inspection);
    }

    /**
     * Sign off a submitted inspection. Restricted to Quality Manager/Admin via
     * the `role:` route middleware - Engineers can submit an inspection, but
     * approving it is a distinct, role-gated action. Deliberately minimal:
     * the only business rule here is "must be submitted, not already
     * approved" - no additional checks (e.g. no open defects) were asked for.
     */
    public function approve(Request $request, Inspection $inspection)
    {
        abort_if($inspection->status !== 'submitted', Response::HTTP_UNPROCESSABLE_ENTITY, 'Only a submitted inspection can be approved.');
        abort_if($inspection->approved_at !== null, Response::HTTP_CONFLICT, 'Inspection is already approved.');

        $inspection->update([
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        $inspection->load($this->detailRelations());

        return new InspectionResource($inspection);
    }

    /**
     * @return array<int, string>
     */
    private function detailRelations(): array
    {
        return [
            'machine',
            'inspector',
            'approvedBy',
            'itemResults.templateItem',
            'itemResults.defects.attachments',
            'itemResults.defects.correctiveActions.assignee',
        ];
    }
}
