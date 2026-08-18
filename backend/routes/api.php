<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Placeholder route proving the frontend can reach the backend. Remove once
// real endpoints are wired up and the frontend calls something meaningful.
Route::get('/ping', fn () => response()->json([
    'status' => 'ok',
    'message' => 'ForgeForce QC backend is reachable.',
    'time' => now()->toIso8601String(),
]));

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
