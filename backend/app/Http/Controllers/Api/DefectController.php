<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttachmentRequest;
use App\Http\Requests\StoreDefectRequest;
use App\Http\Requests\UpdateDefectRequest;
use App\Http\Resources\AttachmentResource;
use App\Http\Resources\DefectResource;
use App\Models\Attachment;
use App\Models\Defect;
use App\Models\InspectionItemResult;
use Illuminate\Http\Response;

class DefectController extends Controller
{
    public function store(StoreDefectRequest $request)
    {
        $itemResult = InspectionItemResult::findOrFail($request->validated('inspection_item_result_id'));

        abort_if(
            $itemResult->result !== 'fail',
            Response::HTTP_UNPROCESSABLE_ENTITY,
            'A defect can only be recorded against a checklist item marked Fail.'
        );

        $defect = Defect::create([
            'inspection_item_result_id' => $itemResult->id,
            'description' => $request->validated('description'),
            'severity' => $request->validated('severity'),
            'status' => 'open',
            'created_by' => $request->user()->id,
        ]);

        $defect->load('attachments', 'correctiveActions');

        return (new DefectResource($defect))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateDefectRequest $request, Defect $defect)
    {
        $defect->update($request->validated());

        $defect->load('attachments', 'correctiveActions.assignee');

        return new DefectResource($defect);
    }

    public function storeAttachment(StoreAttachmentRequest $request, Defect $defect)
    {
        $file = $request->file('photo');

        // Local disk storage — a stand-in for cloud storage (e.g. S3) in this evaluation.
        $path = $file->store('defect-photos', 'public');

        $attachment = Attachment::create([
            'defect_id' => $defect->id,
            'disk_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        return (new AttachmentResource($attachment))->response()->setStatusCode(Response::HTTP_CREATED);
    }
}
