<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'username' => $this->username,
            'avatar' => $this->avatar
                ? (str_starts_with($this->avatar, 'http') ? $this->avatar : Storage::disk('public')->url($this->avatar))
                : null,
            // Only exposed when the caller is looking at their own profile.
            'email' => $this->when($request->user()?->id === $this->id, $this->email),
            'phone' => $this->when($request->user()?->id === $this->id, $this->phone),
            'birthday' => $this->when($request->user()?->id === $this->id, $this->birthday),
            'status' => $this->when($request->user()?->id === $this->id, $this->status),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'last_login_at' => $this->when($request->user()?->id === $this->id, $this->last_login_at),
        ];
    }
}
