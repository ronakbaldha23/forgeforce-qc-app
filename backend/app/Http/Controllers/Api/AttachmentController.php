<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function destroy(Attachment $attachment)
    {
        Storage::disk('public')->delete($attachment->disk_path);
        $attachment->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
