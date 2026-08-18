<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['machine_type_id', 'name', 'version', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function machineType(): BelongsTo
    {
        return $this->belongsTo(MachineType::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InspectionTemplateItem::class)->orderBy('sort_order');
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(Inspection::class);
    }
}
