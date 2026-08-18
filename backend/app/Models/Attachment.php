<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'defect_id',
        'disk_path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'uploaded_by',
    ];

    public function defect(): BelongsTo
    {
        return $this->belongsTo(Defect::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
