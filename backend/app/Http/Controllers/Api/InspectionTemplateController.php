<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InspectionTemplateResource;
use App\Models\Machine;
use Illuminate\Http\Response;

class InspectionTemplateController extends Controller
{
    public function forMachine(Machine $machine)
    {
        $template = $machine->machineType
            ->inspectionTemplates()
            ->where('is_active', true)
            ->with('items')
            ->latest('version')
            ->first();

        abort_if(! $template, Response::HTTP_NOT_FOUND, 'No active inspection template for this machine type.');

        return new InspectionTemplateResource($template);
    }
}
