<?php

use Illuminate\Support\Facades\Route;

// This backend is API-only; the frontend is a separate React app.
// See routes/api.php for the actual endpoints.
Route::get('/', fn () => response()->json([
    'service' => 'ForgeForce QC API',
    'status' => 'ok',
]));
