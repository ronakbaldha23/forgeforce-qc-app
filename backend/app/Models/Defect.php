<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Defect extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_item_result_id',
        'description',
        'severity',
        'status',
        'created_by',
    ];

    public function itemResult(): BelongsTo
    {
        return $this->belongsTo(InspectionItemResult::class, 'inspection_item_result_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function correctiveActions(): HasMany
    {
        return $this->hasMany(CorrectiveAction::class);
    }
}
