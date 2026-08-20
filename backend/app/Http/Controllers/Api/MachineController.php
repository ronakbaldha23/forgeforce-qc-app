<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InspectionSummaryResource;
use App\Http\Resources\MachineDetailResource;
use App\Http\Resources\MachineResource;
use App\Models\Machine;

class MachineController extends Controller
{
    public function index()
    {
        return MachineResource::collection(
            Machine::with('machineType')->orderBy('code')->get()
        );
    }

    public function show(Machine $machine)
    {
        $machine->load(['machineType', 'inspections' => fn ($q) => $q->where('status', 'draft')]);

        return new MachineDetailResource($machine);
    }

    public function inspections(Machine $machine)
    {
        $inspections = $machine->inspections()
            ->with(['inspector', 'itemResults.defects'])
            ->latest('started_at')
            ->get();

        return InspectionSummaryResource::collection($inspections);
    }
}
