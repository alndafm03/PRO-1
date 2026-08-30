<?php

namespace App\Policies;

use App\Models\Author_request;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class Author_requestPolicy
{
    public function view(User $user, Author_request $authorRequest): Response
    {
        if ($authorRequest->user_id !== $user->id || ! $authorRequest->isUpgrade()) {
            return Response::deny('هذا الطلب لا يخصك');
        }

        return Response::allow();
    }

    public function cancel(User $user, Author_request $authorRequest): Response
    {
        return $this->view($user, $authorRequest);
    }
}
