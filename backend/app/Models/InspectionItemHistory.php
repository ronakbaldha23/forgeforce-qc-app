<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only audit ledger for inspection item result changes.
 * Rows are never updated or deleted by application code.
 */
class InspectionItemHistory extends Model
{
    protected $table = 'inspection_item_history';

    public $timestamps = false;

    protected $fillable = [
        'inspection_item_result_id',
        'previous_result',
        'new_result',
        'previous_comment',
        'new_comment',
        'changed_by',
        'changed_at',
        'change_reason',
    ];

    protected function casts(): array
    {
        return [
            'changed_at' => 'datetime',
        ];
    }

    public function itemResult(): BelongsTo
    {
        return $this->belongsTo(InspectionItemResult::class, 'inspection_item_result_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
