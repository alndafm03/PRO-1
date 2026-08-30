<?php

namespace App\Policies;

use App\Models\Book;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BookPolicy
{
    /**
     * Can the user view/manage this book as its author?
     * Used for author dashboard: show, updateDraft, submit, requestModification, earnings.
     */
    public function view(User $user, Book $book): Response
    {
        return $user->id === $book->author_id
            ? Response::allow()
            : Response::deny('هذا الكتاب لا يخصك');
    }

    public function update(User $user, Book $book): Response
    {
        return $this->view($user, $book);
    }
}
