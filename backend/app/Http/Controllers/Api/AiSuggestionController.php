<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateDefectSummaryRequest;
use App\Http\Requests\UpdateAiSuggestionRequest;
use App\Http\Resources\AiSuggestionResource;
use App\Models\AiSuggestion;
use App\Models\Inspection;
use App\Services\AiSummaryService;
use Illuminate\Http\Response;

class AiSuggestionController extends Controller
{
    public function __construct(private AiSummaryService $summaries) {}

    public function generateDefectSummary(GenerateDefectSummaryRequest $request)
    {
        $inspection = Inspection::findOrFail($request->validated('inspection_id'));

        $suggestion = $this->summaries->generateForInspection($inspection);

        return (new AiSuggestionResource($suggestion))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Human review of an AI suggestion. This is the only way a suggestion's
     * status leaves "pending" — the AI output itself never becomes an
     * official record without this explicit action, and even then it is
     * only ever read from ai_suggestions, never copied into defects/etc.
     */
    public function update(UpdateAiSuggestionRequest $request, AiSuggestion $aiSuggestion)
    {
        $aiSuggestion->update([
            'status' => $request->validated('status'),
            'accepted_text' => $request->validated('accepted_text'),
            'reviewed_by' => $request->user()->id,
        ]);

        return new AiSuggestionResource($aiSuggestion);
    }
}
