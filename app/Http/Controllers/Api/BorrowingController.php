<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Requests\Borrowing\RequestBorrowingRequest;
use App\Models\Book;
use App\Models\Borrow_option;
use App\Models\Borrowing;
use App\Models\PhysicalCopy;
use App\Models\User_activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class BorrowingController extends Controller
{
    public function index(Request $request)
    {
        $borrowings = $request->user()->borrowings()
            ->with(['book', 'borrow_option'])
            ->latest()
            ->paginate($request->integer('per_page', 20));
        return response()->json(['data' => $borrowings]);
    }
    public function show(Request $request, Borrowing $borrowing)
    {
        if ($borrowing->user_id !== $request->user()->id) {
            abort(403, 'هذه الإعارة لا تخصك');
        }
        return response()->json(['data' => $borrowing->load(['book', 'borrow_option', 'payments'])]);
    }
    public function requestPhysical(RequestBorrowingRequest $request)
    {
        $user = $request->user();
        $book = Book::query()->published()->findOrFail($request->validated('book_id'));
        $option = Borrow_option::where('book_id', $book->id)->findOrFail($request->validated('borrow_option_id'));
        if ($option->physical_price === null) {
            abort(422, 'هذا الخيار غير متاح للإعارة الورقية');
        }
        $borrowing = DB::transaction(function () use ($user, $book, $option) {
            $copy = PhysicalCopy::query()
                ->forBorrowing()->available()
                ->where('book_id', $book->id)
                ->lockForUpdate()
                ->first();
            if (! $copy) {
                abort(422, 'لا توجد نسخة ورقية متاحة للإعارة حاليًا لهذا الكتاب');
            }
            $copy->update(['status' => 'borrowed', 'status_changed_at' => now()]);
            $borrowing = Borrowing::create([
                'user_id' => $user->id,
                'created_by' => $user->id,
                'is_walk_in' => false,
                'book_id' => $book->id,
                'book_type' => 'physical',
                'physical_copy_id' => $copy->id,
                'borrow_option_id' => $option->id,
                'duration_days' => $option->duration_days,
                'price' => $option->physical_price,
                'status' => 'pending',
            ]);
            $borrowing->payments()->create([
                'user_id' => $user->id,
                'amount' => $option->physical_price,
                'status' => 'pending',
            ]);
            return $borrowing;
        });
        User_activity::log($user->id, $book->id, 'borrow');
        return response()->json([
            'message' => 'تم إنشاء طلب الإعارة، بانتظار الدفع',
            'data' => $borrowing->load('payments'),
        ], 201);
    }
    public function requestDigital(RequestBorrowingRequest $request)
    {
        $user = $request->user();
        $book = Book::query()->published()->findOrFail($request->validated('book_id'));
        if (! $book->digital_file) {
            abort(422, 'لا يوجد ملف رقمي متاح لهذا الكتاب');
        }
        $option = Borrow_option::where('book_id', $book->id)->findOrFail($request->validated('borrow_option_id'));
        if ($option->digital_price === null) {
            abort(422, 'هذا الخيار غير متاح للإعارة الرقمية');
        }
        $borrowing = Borrowing::create([
            'user_id' => $user->id,
            'created_by' => $user->id,
            'is_walk_in' => false,
            'book_id' => $book->id,
            'book_type' => 'digital',
            'borrow_option_id' => $option->id,
            'duration_days' => $option->duration_days,
            'price' => $option->digital_price,
            'status' => 'pending',
        ]);
        $borrowing->payments()->create([
            'user_id' => $user->id,
            'amount' => $option->digital_price,
            'status' => 'pending',
        ]);
        User_activity::log($user->id, $book->id, 'borrow');
        return response()->json([
            'message' => 'تم إنشاء طلب الإعارة، بانتظار الدفع',
            'data' => $borrowing->load('payments'),
        ], 201);
    }
    public function renew(Request $request, Borrowing $borrowing)
    {
        if ($borrowing->user_id !== $request->user()->id) {
            abort(403, 'هذه الإعارة لا تخصك');
        }
        if (! $borrowing->canRenew()) {
            abort(422, 'لا يمكن تجديد هذه الإعارة');
        }
        $borrowing->update([
            'end_date' => $borrowing->end_date->copy()->addDays($borrowing->duration_days),
            'renewed' => true,
        ]);
        return response()->json(['message' => 'تم تجديد الإعارة بنجاح', 'data' => $borrowing]);
    }
    public function readDigital(Request $request, Borrowing $borrowing)
    {
        if ($borrowing->user_id !== $request->user()->id) {
            abort(403, 'هذه الإعارة لا تخصك');
        }
        $isPastEnd = $borrowing->end_date !== null && $borrowing->end_date->isPast();
        if ($borrowing->status === 'active' && $isPastEnd) {
            // نظام الغرامات لا يُطبَّق على الإعارات الرقمية أصلًا — الوصول
            // يُمنع تلقائيًا بانتهاء المدة، فلا حاجة لأي غرامة هنا.
            $borrowing->update(['status' => 'expired']);
        }
        if ($borrowing->book_type !== 'digital' || $borrowing->status !== 'active' || $isPastEnd) {
            abort(403, 'انتهت فترة الإعارة أو لا يمكنك الوصول لهذا الكتاب');
        }
        $book = $borrowing->book;
        User_activity::log($request->user()->id, $book->id, 'read');
        return response()->json([
            'data' => [
                'book_id' => $book->id,
                'title' => $book->title,
                'digital_file' => $book->digital_file,
                'end_date' => $borrowing->end_date,
            ],
        ]);
    }
    public function options(Book $book)
    {
        $options = Borrow_option::where('book_id', $book->id)->orderBy('duration_days')->get();
        return response()->json(['data' => $options]);
    }
}
