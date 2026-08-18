<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookFeedback\RateRequest;
use App\Http\Requests\BookFeedback\ReviewRequest;
use App\Models\Book;
use App\Models\Book_feedback;
use App\Models\Borrowing;
use App\Models\Order_items;
use App\Models\User;
use Illuminate\Http\Request;

class BookFeedbackController extends Controller
{
    /**
     * مشاهدة تقييمات ومراجعات كتاب (Guest).
     */
    public function index(Request $request, Book $book)
    {
        $feedback = Book_feedback::where('book_id', $book->id)
            ->with('user:id,full_name,username,avatar')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $feedback]);
    }

    /**
     * FR-50/BR-13: تقييم الكتاب بالنجوم — فقط لمن اشترى الكتاب أو استعاره.
     */
    public function rate(RateRequest $request, Book $book)
    {
        $user = $request->user();

        if (Book_feedback::where('user_id', $user->id)->where('book_id', $book->id)->exists()) {
            abort(422, 'لقد قيّمت هذا الكتاب مسبقًا، استخدم تعديل التقييم');
        }

        if (! $this->canRate($user, $book)) {
            abort(403, 'يمكنك تقييم الكتاب فقط إذا اشتريته أو استعرته');
        }

        $feedback = Book_feedback::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'rating' => $request->validated('rating'),
        ]);

        return response()->json(['message' => 'تم إضافة التقييم بنجاح', 'data' => $feedback], 201);
    }

    /**
     * FR-50: تعديل تقييم النجوم الممنوح سابقًا.
     */
    public function updateRating(RateRequest $request, Book $book)
    {
        $feedback = Book_feedback::where('user_id', $request->user()->id)->where('book_id', $book->id)->first();

        if (! $feedback) {
            abort(404, 'لم تقيّم هذا الكتاب بعد');
        }

        $feedback->update(['rating' => $request->validated('rating')]);

        return response()->json(['message' => 'تم تعديل التقييم بنجاح', 'data' => $feedback]);
    }

    /**
     * FR-51: إضافة مراجعة نصية — تتطلب وجود تقييم بالنجوم مسبقًا (سطر واحد لكل مستخدم/كتاب).
     */
    public function review(ReviewRequest $request, Book $book)
    {
        $feedback = Book_feedback::where('user_id', $request->user()->id)->where('book_id', $book->id)->first();

        if (! $feedback) {
            abort(422, 'يجب تقييم الكتاب بالنجوم أولاً قبل إضافة مراجعة');
        }

        if ($feedback->hasReview()) {
            abort(422, 'لديك مراجعة مسبقًا لهذا الكتاب، استخدم تعديل المراجعة');
        }

        $feedback->update(['comment' => $request->validated('comment')]);

        return response()->json(['message' => 'تم إضافة المراجعة بنجاح', 'data' => $feedback], 201);
    }

    /**
     * FR-51: تعديل نص المراجعة.
     */
    public function updateReview(ReviewRequest $request, Book $book)
    {
        $feedback = Book_feedback::where('user_id', $request->user()->id)->where('book_id', $book->id)->first();

        if (! $feedback || ! $feedback->hasReview()) {
            abort(404, 'لا توجد مراجعة لتعديلها');
        }

        $feedback->update(['comment' => $request->validated('comment')]);

        return response()->json(['message' => 'تم تعديل المراجعة بنجاح', 'data' => $feedback]);
    }

    /**
     * FR-51: حذف نص المراجعة فقط — يبقى التقييم بالنجوم كما هو.
     */
    public function deleteReview(Request $request, Book $book)
    {
        $feedback = Book_feedback::where('user_id', $request->user()->id)->where('book_id', $book->id)->first();

        if (! $feedback || ! $feedback->hasReview()) {
            abort(404, 'لا توجد مراجعة لحذفها');
        }

        $feedback->clearReview();

        return response()->json(['message' => 'تم حذف المراجعة بنجاح', 'data' => $feedback]);
    }

    /**
     * BR-13: التقييم مسموح فقط لمن اشترى الكتاب أو استعاره.
     */
    private function canRate(User $user, Book $book): bool
    {
        $purchased = Order_items::whereHas('order', fn ($q) => $q->where('user_id', $user->id))
            ->where('book_id', $book->id)
            ->whereIn('status', ['confirmed', 'completed'])
            ->exists();

        if ($purchased) {
            return true;
        }

        return Borrowing::where('user_id', $user->id)
            ->where('book_id', $book->id)
            ->whereIn('status', ['active', 'returned', 'expired'])
            ->exists();
    }
}
