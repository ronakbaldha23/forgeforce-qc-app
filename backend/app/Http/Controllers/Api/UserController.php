<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;

class UserController extends Controller
{
    /**
     * Minimal user list, used to populate the corrective-action assignee picker.
     */
    public function index()
    {
        return UserResource::collection(User::orderBy('name')->get());
    }
}
