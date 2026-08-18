<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartInspectionRequest;
use App\Http\Resources\InspectionResource;
use App\Models\Inspection;
use App\Models\Machine;
use App\Services\InspectionService;
use Illuminate\Http\Response;

class InspectionController extends Controller
{
    public function __construct(private InspectionService $inspections) {}

    public function store(StartInspectionRequest $request)
    {
        $machine = Machine::with('machineType')->findOrFail($request->validated('machine_id'));

        $inspection = $this->inspections->start($machine, $request->user());

        $inspection->load(['machine', 'inspector', 'itemResults.templateItem', 'itemResults.defects']);

        return (new InspectionResource($inspection))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Inspection $inspection)
    {
        $inspection->load([
            'machine',
            'inspector',
            'itemResults.templateItem',
            'itemResults.history',
            'itemResults.defects.attachments',
            'itemResults.defects.correctiveActions.assignee',
        ]);

        return new InspectionResource($inspection);
    }

    public function submit(Inspection $inspection)
    {
        abort_if($inspection->status === 'submitted', Response::HTTP_CONFLICT, 'Inspection already submitted.');

        $inspection = $this->inspections->submit($inspection);

        $inspection->load(['machine', 'inspector', 'itemResults.templateItem', 'itemResults.defects']);

        return new InspectionResource($inspection);
    }
}
