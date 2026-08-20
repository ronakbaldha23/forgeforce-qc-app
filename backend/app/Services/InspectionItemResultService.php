<?php

namespace App\Services;

use App\Models\InspectionItemResult;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Owns every write to an inspection item's result. A result is never
 * overwritten silently: each change is paired, in the same transaction,
 * with an append-only row in inspection_item_history recording who changed
 * it, when, the previous value, the new value, and (when the inspection was
 * already submitted) why.
 */
class InspectionItemResultService
{
    public function updateResult(
        InspectionItemResult $result,
        User $user,
        string $newResult,
        ?string $newComment,
        ?string $changeReason,
    ): InspectionItemResult {
        return DB::transaction(function () use ($result, $user, $newResult, $newComment, $changeReason) {
            $result = $result->fresh();

            $result->history()->create([
                'previous_result' => $result->result,
                'new_result' => $newResult,
                'previous_comment' => $result->comment,
                'new_comment' => $newComment,
                'changed_by' => $user->id,
                'changed_at' => now(),
                'change_reason' => $changeReason,
            ]);

            $result->update([
                'result' => $newResult,
                'comment' => $newComment,
                'updated_by' => $user->id,
            ]);

            return $result;
        });
    }
}
