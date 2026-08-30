<?php

namespace App\Policies;

use App\Models\Borrowing;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BorrowingPolicy
{
    public function view(User $user, Borrowing $borrowing): Response
    {
        return $user->id === $borrowing->user_id
            ? Response::allow()
            : Response::deny('هذه الإعارة لا تخصك');
    }

    /**
     * Same ownership rule is also used to gate fine payments on a borrowing.
     */
    public function payFine(User $user, Borrowing $borrowing): Response
    {
        return $user->id === $borrowing->user_id
            ? Response::allow()
            : Response::deny('هذه الغرامة لا تخصك');
    }
}
