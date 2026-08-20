<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCorrectiveActionRequest;
use App\Http\Requests\UpdateCorrectiveActionRequest;
use App\Http\Resources\CorrectiveActionResource;
use App\Models\CorrectiveAction;
use Illuminate\Http\Response;

class CorrectiveActionController extends Controller
{
    public function store(StoreCorrectiveActionRequest $request)
    {
        $action = CorrectiveAction::create([
            ...$request->validated(),
            'status' => 'pending',
            'created_by' => $request->user()->id,
        ]);

        $action->load('assignee', 'createdBy');

        return (new CorrectiveActionResource($action))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateCorrectiveActionRequest $request, CorrectiveAction $correctiveAction)
    {
        $data = $request->validated();

        if (($data['status'] ?? null) && in_array($data['status'], ['completed', 'verified'], true)) {
            $data['completed_at'] = now();
        }

        $correctiveAction->update($data);
        $correctiveAction->load('assignee', 'createdBy');

        return new CorrectiveActionResource($correctiveAction);
    }
}
