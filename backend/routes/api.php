<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CorrectiveActionController;
use App\Http\Controllers\Api\DefectController;
use App\Http\Controllers\Api\InspectionController;
use App\Http\Controllers\Api\InspectionItemResultController;
use App\Http\Controllers\Api\InspectionTemplateController;
use App\Http\Controllers\Api\MachineController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Placeholder route proving the frontend can reach the backend.
Route::get('/ping', fn () => response()->json([
    'status' => 'ok',
    'message' => 'ForgeForce QC backend is reachable.',
    'time' => now()->toIso8601String(),
]));

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/users', [UserController::class, 'index']);

    Route::get('/machines', [MachineController::class, 'index']);
    Route::get('/machines/{machine}', [MachineController::class, 'show']);
    Route::get('/machines/{machine}/inspections', [MachineController::class, 'inspections']);

    Route::get('/inspection-templates/for-machine/{machine}', [InspectionTemplateController::class, 'forMachine']);

    Route::post('/inspections', [InspectionController::class, 'store']);
    Route::get('/inspections/{inspection}', [InspectionController::class, 'show']);
    Route::patch('/inspections/{inspection}/submit', [InspectionController::class, 'submit']);

    Route::put('/inspection-items/{result}', [InspectionItemResultController::class, 'update']);
    Route::get('/inspection-items/{result}/history', [InspectionItemResultController::class, 'history']);

    Route::post('/defects', [DefectController::class, 'store']);
    Route::patch('/defects/{defect}', [DefectController::class, 'update']);
    Route::post('/defects/{defect}/attachments', [DefectController::class, 'storeAttachment']);

    Route::post('/corrective-actions', [CorrectiveActionController::class, 'store']);
    Route::patch('/corrective-actions/{correctiveAction}', [CorrectiveActionController::class, 'update']);
});
