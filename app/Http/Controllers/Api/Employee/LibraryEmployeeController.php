<?php
namespace App\Http\Controllers\Api\Employee;
use App\Http\Controllers\Controller;
use App\Http\Requests\LibraryEmployee\AddCopyRequest;
use App\Http\Requests\LibraryEmployee\CreateManualBookRequest;
use App\Http\Requests\LibraryEmployee\RegisterReturnRequest;
use App\Http\Requests\LibraryEmployee\UpdateCopyRequest;
use App\Models\Book;
use App\Models\Borrowing;
use App\Models\Payment;
use App\Models\PhysicalCopy;
use App\Models\Reservation;
use App\Services\BookProvisioningService;
use App\Services\PaymentActivationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class LibraryEmployeeController extends Controller
{
    public function __construct(
        private readonly BookProvisioningService $provisioning,
        private readonly PaymentActivationService $paymentActivation,
    ) {
    }
    private function formatBookData(?Book $book): ?Book
    {
        if ($book && $book->cover_image && ! str_starts_with($book->cover_image, 'http')) {
            $book->cover_image = asset('storage/' . $book->cover_image);
        }
        return $book;
    }
    public function pendingPayments(Request $request)
    {
        $payments = Payment::where('status', 'pending')
            ->with(['user', 'payable'])
            ->latest()
            ->paginate($request->integer('per_page', 20));
        $payments->getCollection()->transform(function (Payment $payment) {
            if ($payment->payable) {
                if (method_exists($payment->payable, 'book') && $payment->payable->book) {
                    $this->formatBookData($payment->payable->book);
                } elseif ($payment->payable instanceof Book) {
                    $this->formatBookData($payment->payable);
                }
            }
            return $payment;
        });
        return response()->json(['data' => $payments]);
    }
    /**
     * Manual override, kept only for edge cases (e.g. a walk-in payment that
     * was never routed through Stripe). The normal online-payment flow no
     * longer needs this: Stripe's webhook confirms and activates the order,
     * borrowing, or reservation automatically as soon as the charge succeeds.
     */
    public function approvePayment(Payment $payment)
    {
        if ($payment->status !== 'pending') {
            abort(422, 'هذه العملية ليست بانتظار التحقق');
        }
        $payment = $this->paymentActivation->markPaid($payment);
        return response()->json(['message' => 'تم قبول عملية الدفع بنجاح', 'data' => $payment]);
    }
    public function rejectPayment(Payment $payment)
    {
        if ($payment->status !== 'pending') {
            abort(422, 'هذه العملية ليست بانتظار التحقق');
        }
        $payment = $this->paymentActivation->markFailed($payment, 'تم الرفض يدويًا من قبل موظف المكتبة');
        return response()->json(['message' => 'تم رفض عملية الدفع', 'data' => $payment]);
    }
    public function markOrderItemReady(\App\Models\Order_items $orderItem)
    {
        if ($orderItem->type !== 'physical' || $orderItem->status !== 'confirmed') {
            abort(422, 'هذا العنصر غير قابل للتجهيز حاليًا');
        }
        $orderItem->update(['status' => 'ready', 'ready_at' => now()]);
        return response()->json(['message' => 'تم تجهيز الطلب، بانتظار استلام المستخدم', 'data' => $orderItem]);
    }
    public function borrowings(Request $request)
    {
        $borrowings = Borrowing::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->with(['user', 'book'])
            ->latest()
            ->paginate($request->integer('per_page', 20));
        $borrowings->getCollection()->transform(function (Borrowing $borrowing) {
            if ($borrowing->book) {
                $this->formatBookData($borrowing->book);
            }
            return $borrowing;
        });
        return response()->json(['data' => $borrowings]);
    }
    public function registerReturn(RegisterReturnRequest $request, Borrowing $borrowing)
    {
        if ($borrowing->book_type !== 'physical' || $borrowing->status !== 'active') {
            abort(422, 'هذه الإعارة غير قابلة لتسجيل إرجاع حاليًا');
        }
        $isDamaged = $request->boolean('is_damaged');
        DB::transaction(function () use ($borrowing, $isDamaged) {
            $fine = $isDamaged ? 0.0 : $borrowing->calculateFine();
            $borrowing->update([
                'status' => 'returned',
                'returned_at' => now(),
                'fine_amount' => $fine > 0 ? $fine : null,
                'fine_days_late' => $fine > 0 ? $borrowing->daysLateAttribute() : null,
            ]);
            if ($borrowing->physical_copy_id && $borrowing->physicalCopy) {
                $borrowing->physicalCopy->update([
                    'status' => $isDamaged ? 'damaged' : 'available',
                    'status_changed_at' => now(),
                ]);
            }
        });
        return response()->json(['message' => 'تم تسجيل الإرجاع بنجاح', 'data' => $borrowing->fresh()]);
    }
    public function copies(Request $request, Book $book)
    {
        $copies = $book->physicalCopies()
            ->when($request->filled('purpose'), fn ($q) => $q->where('purpose', $request->string('purpose')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate($request->integer('per_page', 50));
        return response()->json(['data' => $copies]);
    }
    public function addCopy(AddCopyRequest $request, Book $book)
    {
        $copy = PhysicalCopy::create([
            'book_id' => $book->id,
            'purpose' => $request->validated('purpose'),
            'copy_code' => $request->validated('copy_code'),
            'status' => 'available',
        ]);
        return response()->json(['message' => 'تمت إضافة النسخة بنجاح', 'data' => $copy], 201);
    }
    public function updateCopy(UpdateCopyRequest $request, PhysicalCopy $copy)
    {
        $copy->update([
            'status' => $request->validated('status'),
            'status_changed_at' => now(),
        ]);
        return response()->json(['message' => 'تم تحديث حالة النسخة بنجاح', 'data' => $copy]);
    }
    public function fines()
    {
        $finalized = Borrowing::query()
            ->whereNotNull('fine_amount')
            ->where('fine_amount', '>', 0)
            ->where('fine_paid', false)
            ->with(['user', 'book'])
            ->get()
            ->map(fn (Borrowing $b) => [
                'borrowing_id' => $b->id,
                'user' => $b->user,
                'book' => $this->formatBookData($b->book),
                'amount' => (float) $b->fine_amount,
                'days_late' => $b->fine_days_late,
                'is_estimated' => false,
            ]);
        $estimated = Borrowing::query()
            ->overdueCandidates()
            ->with(['user', 'book'])
            ->get()
            ->map(fn (Borrowing $b) => [
                'borrowing_id' => $b->id,
                'user' => $b->user,
                'book' => $this->formatBookData($b->book),
                'amount' => $b->calculateFine(),
                'days_late' => $b->daysLateAttribute(),
                'is_estimated' => true,
            ]);
        return response()->json(['data' => $finalized->concat($estimated)->values()]);
    }
    public function markFinePaid(Borrowing $borrowing)
    {
        if (! $borrowing->fine_amount || $borrowing->fine_amount <= 0) {
            abort(422, 'لا توجد غرامة مستحقة على هذه الإعارة');
        }
        if ($borrowing->fine_paid) {
            abort(422, 'الغرامة مسدَّدة مسبقًا');
        }
        $borrowing->update(['fine_paid' => true]);
        return response()->json(['message' => 'تم تسديد الغرامة بنجاح', 'data' => $borrowing]);
    }
    public function reservations(Request $request)
    {
        $reservations = Reservation::query()
            ->when($request->filled('date'), fn ($q) => $q->whereDate('reservation_date', $request->input('date')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->with('user')
            ->latest()
            ->paginate($request->integer('per_page', 20));
        return response()->json(['data' => $reservations]);
    }
    public function createManualBook(CreateManualBookRequest $request)
    {
        $employee = $request->user();
        $data = $request->validated();
        $coverPath = $request->file('cover_image')->store('books/covers', 'public');
        $digitalPath = $request->hasFile('digital_file')
            ? $request->file('digital_file')->store('books/digital', 'local')
            : null;
        $book = DB::transaction(function () use ($employee, $data, $coverPath, $digitalPath) {
            $book = Book::create([
                'author_id' => null,
                'author_name' => $data['author_name'],
                'title' => $data['title'],
                'description' => $data['description'],
                'cover_image' => $coverPath,
                'publisher' => $data['publisher'],
                'publisher_year' => $data['publisher_year'] ?? null,
                'language' => $data['language'],
                'book_type' => $data['book_type'],
                'page_count' => $data['page_count'] ?? null,
                'publish_status' => 'published',
                'is_hidden' => false,
                'price_physical' => $data['price_physical'] ?? null,
                'price_digital' => $data['price_digital'] ?? null,
                'digital_file' => $digitalPath,
                'created_by' => $employee->id,
                'published_at' => now(),
            ]);
            $book->categories()->sync($data['category_ids']);
            $this->provisioning->syncPhysicalCopies($book, $data['sale_copies_count'] ?? 0, $data['borrow_copies_count'] ?? 0);
            $this->provisioning->syncBorrowOptions($book, $data['borrow_options'] ?? null);
            return $book;
        });
        $loadedBook = $book->load(['categories', 'borrow_option', 'physicalCopies']);
        $this->formatBookData($loadedBook);
        return response()->json([
            'message' => 'تم إدخال الكتاب ونشره بنجاح',
            'data' => $loadedBook,
        ], 201);
    }
}

