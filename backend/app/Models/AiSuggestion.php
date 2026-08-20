<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiSuggestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'defect_id',
        'suggestion_type',
        'input_snapshot',
        'suggested_text',
        'status',
        'reviewed_by',
        'accepted_text',
    ];

    protected function casts(): array
    {
        return [
            'input_snapshot' => 'array',
        ];
    }

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    public function defect(): BelongsTo
    {
        return $this->belongsTo(Defect::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
