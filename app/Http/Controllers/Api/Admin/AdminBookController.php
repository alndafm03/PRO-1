<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Book_feedback;

class AdminBookController extends Controller
{
    // اخفاء كتاب
    public function hide(Book $book)
    {
        $book->update(['is_hidden' => true]);

        return response()->json(['message' => 'تم إخفاء الكتاب بنجاح', 'data' => $book]);
    }

    //اظهار الكتاب م
    public function unhide(Book $book)
    {
        $book->update(['is_hidden' => false]);

        return response()->json(['message' => 'تم إظهار الكتاب بنجاح', 'data' => $book]);
    }

    public function deleteReview(Book_feedback $review)
    {
        $review->clearReview();

        return response()->json(['message' => 'تم حذف نص المراجعة بنجاح', 'data' => $review]);
    }
}
