<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionTemplateItem extends Model
{
    use HasFactory;

    protected $fillable = ['inspection_template_id', 'label', 'help_text', 'sort_order'];

    public function inspectionTemplate(): BelongsTo
    {
        return $this->belongsTo(InspectionTemplate::class);
    }

    public function itemResults(): HasMany
    {
        return $this->hasMany(InspectionItemResult::class);
    }
}
