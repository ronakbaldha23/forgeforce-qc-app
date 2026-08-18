<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateInspectionItemResultRequest;
use App\Http\Resources\InspectionItemHistoryResource;
use App\Http\Resources\InspectionItemResultResource;
use App\Models\InspectionItemResult;
use App\Services\InspectionItemResultService;
use Illuminate\Http\Response;

class InspectionItemResultController extends Controller
{
    public function __construct(private InspectionItemResultService $service) {}

    public function update(UpdateInspectionItemResultRequest $request, InspectionItemResult $result)
    {
        $result->load('inspection');
        $user = $request->user();

        if ($result->inspection->status === 'submitted') {
            $isOwner = $result->inspection->inspector_id === $user->id;
            $isReviewer = in_array($user->role, ['quality_manager', 'admin'], true);

            abort_if(
                ! $isOwner && ! $isReviewer,
                Response::HTTP_FORBIDDEN,
                'Only the original inspector, a quality manager, or an admin may correct a submitted inspection item.'
            );
        }

        $updated = $this->service->updateResult(
            $result,
            $user,
            $request->validated('result'),
            $request->validated('comment'),
            $request->validated('change_reason'),
        );

        $updated->load(['templateItem', 'defects.attachments', 'defects.correctiveActions']);

        return new InspectionItemResultResource($updated);
    }

    public function history(InspectionItemResult $result)
    {
        return InspectionItemHistoryResource::collection(
            $result->history()->with('changedBy')->orderBy('changed_at')->get()
        );
    }
}
