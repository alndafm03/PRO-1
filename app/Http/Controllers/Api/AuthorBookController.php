<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthorBook\StoreAuthorBookRequest;
use App\Http\Requests\AuthorBook\UpdateAuthorBookRequest;
use App\Http\Requests\AuthorRequest\RequestBookModificationRequest;
use App\Models\Author_request;
use App\Models\Book;
use App\Services\BookProvisioningService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthorBookController extends Controller
{
    public function __construct(private readonly BookProvisioningService $provisioning)
    {
    }

    /**
     * FR-41: عرض قائمة الكتب المرفوعة بواسطة هذا المؤلف.
     */
    public function index(Request $request)
    {
        $books = $request->user()->authoredBooks()
            ->with('categories')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $books]);
    }

    /**
     * عرض تفاصيل كتاب محدد للمؤلف.
     */
    public function show(Request $request, Book $book)
    {
        if ($book->author_id !== $request->user()->id) {
            abort(403, 'هذا الكتاب لا يخصك');
        }

        return response()->json(['data' => $book->load(['categories', 'borrow_option', 'physicalCopies'])]);
    }

    /**
     * FR-41/FR-42: إنشاء مسودة كتاب جديد (Draft) بكل بياناته (النسخ، الأسعار، الأقسام، خيارات الإعارة).
     * الملف الرقمي يُخزَّن على disk محلي (local) غير عام — القراءة تتم فقط عبر endpoint محمي (BR-11/FR-35)،
     * لا يوجد رابط تنزيل مباشر.
     */
    public function store(StoreAuthorBookRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $coverPath = $request->file('cover_image')->store('books/covers', 'public');
        $digitalPath = $request->hasFile('digital_file')
            ? $request->file('digital_file')->store('books/digital', 'local')
            : null;

        $book = DB::transaction(function () use ($user, $data, $coverPath, $digitalPath) {
            $book = Book::create([
                'author_id' => $user->id,
                'title' => $data['title'],
                'description' => $data['description'],
                'cover_image' => $coverPath,
                'publisher' => $data['publisher'],
                'publisher_year' => $data['publisher_year'] ?? null,
                'language' => $data['language'],
                'book_type' => $data['book_type'],
                'page_count' => $data['page_count'] ?? null,
                'publish_status' => 'draft',
                'is_hidden' => false,
                'price_physical' => $data['price_physical'] ?? null,
                'price_digital' => $data['price_digital'] ?? null,
                'digital_file' => $digitalPath,
                'submitted_by' => $user->id,
            ]);

            $book->categories()->sync($data['category_ids']);
            $this->provisioning->syncPhysicalCopies($book, $data['sale_copies_count'] ?? 0, $data['borrow_copies_count'] ?? 0);
            $this->provisioning->syncBorrowOptions($book, $data['borrow_options'] ?? null);

            return $book;
        });

        return response()->json([
            'message' => 'تم إنشاء مسودة الكتاب بنجاح',
            'data' => $book->load(['categories', 'borrow_option', 'physicalCopies']),
        ], 201);
    }

    /**
     * FR-41: تعديل بيانات مسودة الكتاب قبل التقديم — متاح فقط طالما الكتاب بحالة Draft.
     */
    public function updateDraft(UpdateAuthorBookRequest $request, Book $book)
    {
        if ($book->author_id !== $request->user()->id) {
            abort(403, 'هذا الكتاب لا يخصك');
        }

        if ($book->publish_status !== 'draft') {
            abort(422, 'لا يمكن تعديل كتاب بعد إرساله للمراجعة');
        }

        $data = $request->validated();

        $fields = collect($data)->only([
            'title', 'description', 'publisher', 'publisher_year', 'language',
            'page_count', 'book_type', 'price_physical', 'price_digital',
        ])->toArray();

        if ($request->hasFile('cover_image')) {
            $fields['cover_image'] = $request->file('cover_image')->store('books/covers', 'public');
        }

        if ($request->hasFile('digital_file')) {
            $fields['digital_file'] = $request->file('digital_file')->store('books/digital', 'local');
        }

        DB::transaction(function () use ($book, $fields, $data) {
            if (! empty($fields)) {
                $book->update($fields);
            }

            if (array_key_exists('category_ids', $data)) {
                $book->categories()->sync($data['category_ids']);
            }

            if (array_key_exists('sale_copies_count', $data) || array_key_exists('borrow_copies_count', $data)) {
                $this->provisioning->syncPhysicalCopies(
                    $book,
                    $data['sale_copies_count'] ?? $book->physicalCopies()->forSale()->count(),
                    $data['borrow_copies_count'] ?? $book->physicalCopies()->forBorrowing()->count(),
                );
            }

            if (array_key_exists('borrow_options', $data)) {
                $this->provisioning->syncBorrowOptions($book, $data['borrow_options']);
            }
        });

        return response()->json([
            'message' => 'تم تحديث مسودة الكتاب بنجاح',
            'data' => $book->fresh()->load(['categories', 'borrow_option', 'physicalCopies']),
        ]);
    }

    /**
     * FR-42: إرسال المسودة للمراجعة (Draft -> Submitted).
     */
    public function submit(Request $request, Book $book)
    {
        if ($book->author_id !== $request->user()->id) {
            abort(403, 'هذا الكتاب لا يخصك');
        }

        if ($book->publish_status !== 'draft') {
            abort(422, 'هذا الكتاب ليس بحالة مسودة');
        }

        $book->update(['publish_status' => 'submitted']);

        return response()->json(['message' => 'تم إرسال الكتاب للمراجعة', 'data' => $book]);
    }

    /**
     * FR-43: طلب إجراء تعديل على كتاب منشور مسبقًا (لا يعدَّل الكتاب المنشور مباشرة).
     */
    public function requestModification(RequestBookModificationRequest $request, Book $book)
    {
        if ($book->author_id !== $request->user()->id) {
            abort(403, 'هذا الكتاب لا يخصك');
        }

        if ($book->publish_status !== 'published') {
            abort(422, 'طلب التعديل متاح فقط للكتب المنشورة');
        }

        $hasActive = Author_request::query()
            ->bookModification()
            ->where('book_id', $book->id)
            ->whereIn('status', ['pending', 'changes_requested'])
            ->exists();

        if ($hasActive) {
            abort(422, 'يوجد طلب تعديل قيد المعالجة لهذا الكتاب بالفعل');
        }

        $modificationRequest = Author_request::create([
            'user_id' => $request->user()->id,
            'request_type' => 'book_modification',
            'book_id' => $book->id,
            'changes' => $request->validated('changes'),
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'تم إرسال طلب التعديل بنجاح', 'data' => $modificationRequest], 201);
    }
}
