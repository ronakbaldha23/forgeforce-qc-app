<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionItemResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'inspection_template_item_id',
        'result',
        'comment',
        'updated_by',
    ];

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(Inspection::class);
    }

    public function templateItem(): BelongsTo
    {
        return $this->belongsTo(InspectionTemplateItem::class, 'inspection_template_item_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function history(): HasMany
    {
        return $this->hasMany(InspectionItemHistory::class)->orderBy('changed_at');
    }

    public function defects(): HasMany
    {
        return $this->hasMany(Defect::class);
    }
}
