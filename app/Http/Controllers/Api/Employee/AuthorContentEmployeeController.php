<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthorContentEmployee\RejectBookRequest;
use App\Http\Requests\AuthorContentEmployee\RequestBookChangesRequest;
use App\Models\Author_request;
use App\Models\Book;
use App\Models\Notification;
use Illuminate\Http\Request;

class AuthorContentEmployeeController extends Controller
{
    /**
     * FR-43: الحقول المسموح تحديثها بالكتاب عبر طلب تعديل مقبول.
     */
    private const MODIFIABLE_BOOK_FIELDS = [
        'title', 'description', 'publisher', 'publisher_year', 'language',
        'page_count', 'price_physical', 'price_digital',
    ];

    // ------------------------------------------------------------------
    // FR-39: طلبات ترقية Reader -> Author
    // ------------------------------------------------------------------

    /**
     * عرض طلبات الترقية بانتظار المراجعة.
     */
    public function authorRequests(Request $request)
    {
        $requests = Author_request::query()
            ->upgrade()
            ->where('status', 'pending')
            ->with('user')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $requests]);
    }

    /**
     * FR-39: موافقة مبدئية وتحويل الطلب للمدير.
     */
    public function preApprove(Request $request, Author_request $authorRequest)
    {
        $this->guardUpgradePending($authorRequest);

        $authorRequest->update([
            'status' => 'pre_approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        Notification::notify($authorRequest->user_id, 'request_update', [
            'request_id' => $authorRequest->id, 'request_type' => 'author_upgrade', 'decision' => 'pre_approved',
        ]);

        return response()->json(['message' => 'تمت الموافقة المبدئية على الطلب', 'data' => $authorRequest]);
    }

    /**
     * FR-39: رفض طلب الانضمام كمؤلف.
     */
    public function reject(Request $request, Author_request $authorRequest)
    {
        $this->guardUpgradePending($authorRequest);

        $authorRequest->update([
            'status' => 'rejected_by_employee',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        Notification::notify($authorRequest->user_id, 'request_update', [
            'request_id' => $authorRequest->id, 'request_type' => 'author_upgrade', 'decision' => 'rejected',
        ]);

        return response()->json(['message' => 'تم رفض الطلب', 'data' => $authorRequest]);
    }

    /**
     * FR-39: طلب تعديلات على طلب الانضمام (المستخدم يلغي ويعيد التقديم — لا يوجد endpoint تعديل مباشر).
     */
    public function requestChanges(Request $request, Author_request $authorRequest)
    {
        $this->guardUpgradePending($authorRequest);

        $authorRequest->update([
            'status' => 'changes_requested',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        Notification::notify($authorRequest->user_id, 'request_update', [
            'request_id' => $authorRequest->id, 'request_type' => 'author_upgrade', 'decision' => 'changes_requested',
        ]);

        return response()->json(['message' => 'تم طلب تعديل على الطلب', 'data' => $authorRequest]);
    }

    // ------------------------------------------------------------------
    // FR-42: مراجعة الكتب المقدمة للنشر
    // ------------------------------------------------------------------

    /**
     * عرض الكتب بانتظار التدقيق (المرسلة حديثًا أو قيد المراجعة حاليًا).
     */
    public function pendingBooks(Request $request)
    {
        $books = Book::query()
            ->whereIn('publish_status', ['submitted', 'under_review'])
            ->with(['author', 'categories'])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $books]);
    }

    /**
     * FR-42: قفل الكتاب وقيد المراجعة لمنع تعارض الموظفين (Submitted -> Under Review).
     */
    public function startReview(Request $request, Book $book)
    {
        if ($book->publish_status !== 'submitted') {
            abort(422, 'هذا الكتاب ليس بانتظار المراجعة');
        }

        $book->update([
            'publish_status' => 'under_review',
            'reviewed_by' => $request->user()->id,
        ]);

        return response()->json(['message' => 'تم قفل الكتاب لمراجعتك', 'data' => $book]);
    }

    /**
     * FR-42: الموافقة على نشر الكتاب (Under Review -> Published مباشرة، لا توجد حالة Approved منفصلة بالـDB).
     */
    public function approveBook(Request $request, Book $book)
    {
        $this->guardBookUnderReview($request, $book);

        $book->update([
            'publish_status' => 'published',
            'published_at' => now(),
            'reviewed_by' => $request->user()->id,
        ]);

        $this->notifyBookAuthor($book, 'approved');

        return response()->json(['message' => 'تمت الموافقة على الكتاب ونشره', 'data' => $book]);
    }

    /**
     * FR-44: رفض نشر الكتاب مع سبب اختياري.
     */
    public function rejectBook(RejectBookRequest $request, Book $book)
    {
        $this->guardBookUnderReview($request, $book);

        $book->update([
            'publish_status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => $request->validated('rejection_reason'),
        ]);

        $this->notifyBookAuthor($book, 'rejected');

        return response()->json(['message' => 'تم رفض الكتاب', 'data' => $book]);
    }

    /**
     * FR-42: طلب تعديلات بالمحتوى قبل النشر (Under Review -> Changes Required).
     */
    public function requestBookChanges(RequestBookChangesRequest $request, Book $book)
    {
        $this->guardBookUnderReview($request, $book);

        $book->update([
            'publish_status' => 'changes_required',
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => $request->validated('notes'),
        ]);

        $this->notifyBookAuthor($book, 'changes_required');

        return response()->json(['message' => 'تم طلب تعديلات على الكتاب', 'data' => $book]);
    }

    // ------------------------------------------------------------------
    // FR-43: طلبات تعديل كتب منشورة
    // ------------------------------------------------------------------

    /**
     * عرض طلبات التعديل على كتب منشورة بانتظار المراجعة.
     */
    public function modificationRequests(Request $request)
    {
        $requests = Author_request::query()
            ->bookModification()
            ->where('status', 'pending')
            ->with(['user', 'book'])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $requests]);
    }

    /**
     * FR-43: قبول التعديل — يُطبَّق تلقائيًا على الكتاب (فقط الحقول المسموحة).
     */
    public function approveModification(Request $request, Author_request $authorRequest)
    {
        $this->guardModificationPending($authorRequest);

        $changes = collect($authorRequest->changes ?? [])->only(self::MODIFIABLE_BOOK_FIELDS)->toArray();

        if (! empty($changes) && $authorRequest->book) {
            $authorRequest->book->update($changes);
        }

        $authorRequest->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        Notification::notify($authorRequest->user_id, 'request_update', [
            'request_id' => $authorRequest->id, 'request_type' => 'book_modification',
            'book_id' => $authorRequest->book_id, 'decision' => 'approved',
        ]);

        return response()->json(['message' => 'تم قبول التعديل وتحديث الكتاب', 'data' => $authorRequest->fresh()]);
    }

    /**
     * FR-43: رفض طلب التعديل.
     */
    public function rejectModification(Request $request, Author_request $authorRequest)
    {
        $this->guardModificationPending($authorRequest);

        $authorRequest->update([
            'status' => 'rejected_by_employee',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        Notification::notify($authorRequest->user_id, 'request_update', [
            'request_id' => $authorRequest->id, 'request_type' => 'book_modification',
            'book_id' => $authorRequest->book_id, 'decision' => 'rejected',
        ]);

        return response()->json(['message' => 'تم رفض طلب التعديل', 'data' => $authorRequest]);
    }

    // ------------------------------------------------------------------

    private function guardUpgradePending(Author_request $authorRequest): void
    {
        if (! $authorRequest->isUpgrade() || $authorRequest->status !== 'pending') {
            abort(422, 'هذا الطلب غير قابل لهذا الإجراء حاليًا');
        }
    }

    private function guardModificationPending(Author_request $authorRequest): void
    {
        if ($authorRequest->isUpgrade() || $authorRequest->status !== 'pending') {
            abort(422, 'هذا الطلب غير قابل لهذا الإجراء حاليًا');
        }
    }

    private function guardBookUnderReview(Request $request, Book $book): void
    {
        if ($book->publish_status !== 'under_review') {
            abort(422, 'هذا الكتاب ليس قيد المراجعة');
        }

        if ($book->reviewed_by !== null && $book->reviewed_by !== $request->user()->id) {
            abort(403, 'هذا الكتاب قيد مراجعة موظف آخر');
        }
    }

    private function notifyBookAuthor(Book $book, string $decision): void
    {
        $recipientId = $book->author_id ?? $book->submitted_by;

        if ($recipientId !== null) {
            Notification::notify($recipientId, 'request_update', [
                'book_id' => $book->id, 'request_type' => 'book_publish', 'decision' => $decision,
            ]);
        }
    }
}
