<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Order_items;
use App\Models\User;
use Illuminate\Http\Request;

class BookController extends Controller
{
    /**
     * FR-09: عرض قائمة الكتب المنشورة والظاهرة للعموم (Guest).
     */
    public function index(Request $request)
    {
        $books = Book::query()
            ->published()
            ->with(['categories', 'author'])
            ->latest('published_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $books]);
    }

    /**
     * FR-11: تفاصيل كتاب محدد + الإحصائيات المحسوبة (القسم 35).
     */
    public function show(Book $book)
    {
        if ($book->publish_status !== 'published' || $book->is_hidden) {
            return response()->json(['message' => 'الكتاب غير متاح'], 404);
        }

        $book->load([
            'categories',
            'author',
            'borrow_option',
            'physicalCopies' => fn ($q) => $q->forSale()->available(),
        ]);

        return response()->json([
            'data' => [
                'book' => $book,
                'rating_avg' => $book->ratingAvgAttribute(),
                'rating_count' => $book->ratingCountAttribute(),
                'sales_count' => $book->salesCountAttribute(),
                'borrow_count' => $book->borrowCountAttribute(),
                'available_physical_copies_for_borrowing' => $book->availablePhysicalCopiesCountAttribute(),
            ],
        ]);
    }

    /**
     * FR-11 / FR-25: التحقق من توفر النسخ الورقية (بيع/إعارة) لكتاب.
     */
    public function availability(Book $book)
    {
        $availableForSale = $book->physicalCopies()
            ->forSale()->available()->count();

        $availableForBorrowing = $book->availablePhysicalCopiesCountAttribute();

        return response()->json([
            'data' => [
                'available_for_sale' => $availableForSale,
                'available_for_borrowing' => $availableForBorrowing,
                // BR-01: لا يوجد نسخة متاحة للإعارة = Currently Unavailable، ولا يوجد Waitlist
                'currently_unavailable_for_borrowing' => $availableForBorrowing === 0,
            ],
        ]);
    }

    /**
     * البروفايل العام للمؤلف وكتبه المنشورة فقط (BR-10: التعطيل لا يخفي الكتب تلقائيًا).
     */
    public function authorProfile(User $user)
    {
        if (! $user->isAuthor()) {
            return response()->json(['message' => 'هذا المستخدم ليس مؤلفًا'], 404);
        }

        $books = $user->authoredBooks()
            ->published()
            ->with('categories')
            ->paginate(20);

        return response()->json([
            'data' => [
                'author' => $user->only(['id', 'full_name', 'username', 'avatar']),
                'books' => $books,
            ],
        ]);
    }

    /**
     * FR-35 / BR-11: فتح واجهة قراءة كتاب رقمي تم شراؤه (وصول دائم حتى لو أُخفي الكتاب لاحقًا).
     */
    public function readDigital(Request $request, Book $book)
    {
        $hasAccess = Order_items::whereHas('order', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })
            ->where('book_id', $book->id)
            ->where('type', 'digital')
            ->whereIn('status', ['confirmed', 'completed'])
            ->exists();

        if (! $hasAccess) {
            return response()->json(['message' => 'ليس لديك صلاحية قراءة هذا الكتاب'], 403);
        }

        if (! $book->digital_file) {
            return response()->json(['message' => 'الملف الرقمي غير متوفر'], 404);
        }

        // FR-35: القراءة داخل النظام فقط ولا يسمح بتنزيل الملف.
        // TODO: استبدل هذا الحقل برابط Streaming محمي (Signed URL قصير الصلاحية) بدل تمرير المسار مباشرة.
        return response()->json([
            'data' => [
                'book_id' => $book->id,
                'title' => $book->title,
                'digital_file' => $book->digital_file,
            ],
        ]);
    }
}
