<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\LibraryEmployee\AddCopyRequest;
use App\Http\Requests\LibraryEmployee\CreateManualBookRequest;
use App\Http\Requests\LibraryEmployee\RegisterReturnRequest;
use App\Http\Requests\LibraryEmployee\UpdateCopyRequest;
use App\Models\Book;
use App\Models\Borrowing;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PhysicalCopy;
use App\Models\Reservation;
use App\Models\System_setting;
use App\Services\BookProvisioningService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LibraryEmployeeController extends Controller
{
    public function __construct(private readonly BookProvisioningService $provisioning)
    {
    }

    /**
     * FR-20/BR-08: عرض عمليات الدفع بانتظار التحقق اليدوي.
     */
    public function pendingPayments(Request $request)
    {
        $payments = Payment::where('status', 'pending')
            ->with(['user', 'payable'])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $payments]);
    }

    /**
     * FR-19/FR-20/BR-08: قبول عملية الدفع — يفعّل العملية المرتبطة (شراء/إعارة/حجز) FR-73 ينبّه المستخدم.
     */
    public function approvePayment(Payment $payment)
    {
        if ($payment->status !== 'pending') {
            abort(422, 'هذه العملية ليست بانتظار التحقق');
        }

        DB::transaction(function () use ($payment) {
            $payment->update(['status' => 'verified']);
            $this->activatePayable($payment);
        });

        return response()->json(['message' => 'تم قبول عملية الدفع بنجاح', 'data' => $payment->fresh()]);
    }

    /**
     * FR-19/FR-20/BR-08: رفض عملية الدفع — يرفض العملية المرتبطة ويحرر أي نسخة فيزيائية محجوزة لها.
     */
    public function rejectPayment(Payment $payment)
    {
        if ($payment->status !== 'pending') {
            abort(422, 'هذه العملية ليست بانتظار التحقق');
        }

        DB::transaction(function () use ($payment) {
            $payment->update(['status' => 'rejected']);
            $this->rejectPayable($payment);
        });

        return response()->json(['message' => 'تم رفض عملية الدفع', 'data' => $payment->fresh()]);
    }

    /**
     * FR-17: تغيير حالة طلب الكتاب الورقي إلى "جاهز للاستلام" بعد تجهيزه.
     */
    public function markOrderItemReady(\App\Models\Order_items $orderItem)
    {
        if ($orderItem->type !== 'physical' || $orderItem->status !== 'confirmed') {
            abort(422, 'هذا العنصر غير قابل للتجهيز حاليًا');
        }

        $orderItem->update(['status' => 'ready', 'ready_at' => now()]);

        return response()->json(['message' => 'تم تجهيز الطلب، بانتظار استلام المستخدم', 'data' => $orderItem]);
    }

    /**
     * FR-65: عرض جميع عمليات الإعارة الجارية والمعلقة.
     */
    public function borrowings(Request $request)
    {
        $borrowings = Borrowing::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->with(['user', 'book'])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $borrowings]);
    }

    /**
     * FR-26: تسجيل إرجاع النسخة الورقية، حساب الغرامة عند التأخير — بدون غرامة للتالف (Out of Scope).
     */
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

    /**
     * FR-65: عرض كل النسخ الورقية لكتاب (بيع وإعارة).
     */
    public function copies(Request $request, Book $book)
    {
        $copies = $book->physicalCopies()
            ->when($request->filled('purpose'), fn ($q) => $q->where('purpose', $request->string('purpose')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate($request->integer('per_page', 50));

        return response()->json(['data' => $copies]);
    }

    /**
     * FR-57/FR-65: إضافة نسخة فيزيائية جديدة (بيع أو إعارة) لكتاب.
     */
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

    /**
     * FR-65: تعديل حالة نسخة فيزيائية (متاحة، تالفة، مفقودة).
     */
    public function updateCopy(UpdateCopyRequest $request, PhysicalCopy $copy)
    {
        $copy->update([
            'status' => $request->validated('status'),
            'status_changed_at' => now(),
        ]);

        return response()->json(['message' => 'تم تحديث حالة النسخة بنجاح', 'data' => $copy]);
    }

    /**
     * FR-33/FR-65: عرض قائمة الغرامات المستحقة على القراء (نهائية غير مسددة + تقديرية للمتأخرة حاليًا).
     */
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
                'book' => $b->book,
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
                'book' => $b->book,
                'amount' => $b->calculateFine(),
                'days_late' => $b->daysLateAttribute(),
                'is_estimated' => true,
            ]);

        return response()->json(['data' => $finalized->concat($estimated)->values()]);
    }

    /**
     * FR-65: تسديد الغرامة وإغلاق ذمة القارئ.
     */
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

    /**
     * FR-65: متابعة كافة الحجوزات اليومية للمقاعد.
     */
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

    /**
     * FR-45/FR-46: إدخال كتاب يدوي بدون ربطه بحساب مؤلف — يُنشر مباشرة بدون موافقة Admin.
     */
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

        return response()->json([
            'message' => 'تم إدخال الكتاب ونشره بنجاح',
            'data' => $book->load(['categories', 'borrow_option', 'physicalCopies']),
        ], 201);
    }

    /**
     * FR-73 "Operation Confirmation": تفعيل العملية المرتبطة حسب نوعها + إشعار المستخدم.
     */
    private function activatePayable(Payment $payment): void
    {
        $payable = $payment->payable;

        if ($payable instanceof Order) {
            $payable->update(['status' => 'confirmed']);
            $payable->items()->update(['status' => 'confirmed']);

            Notification::notify($payable->user_id, 'operation_confirmation', [
                'order_id' => $payable->id, 'kind' => 'purchase', 'decision' => 'approved',
            ]);
        } elseif ($payable instanceof Borrowing) {
            $authorRevenuePercent = (float) System_setting::getValue('author_revenue_percent', 0);
            $authorSharePercent = $payable->book?->author_id !== null ? $authorRevenuePercent : null;
            $authorShareAmount = $authorSharePercent !== null
                ? round((float) $payable->price * $authorSharePercent / 100, 2)
                : null;

            $payable->update([
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays($payable->duration_days)->toDateString(),
                'author_revenue_percent_snapshot' => $authorSharePercent,
                'author_share_amount' => $authorShareAmount,
            ]);

            Notification::notify($payable->user_id, 'operation_confirmation', [
                'borrowing_id' => $payable->id, 'kind' => 'borrowing', 'decision' => 'approved',
            ]);
        } elseif ($payable instanceof Reservation) {
            $payable->update(['status' => 'confirmed']);

            Notification::notify($payable->user_id, 'operation_confirmation', [
                'reservation_id' => $payable->id, 'kind' => 'reservation', 'decision' => 'approved',
            ]);
        }
    }

    /**
     * FR-73 "Operation Confirmation": رفض العملية المرتبطة + تحرير أي نسخة فيزيائية محجوزة + إشعار.
     */
    private function rejectPayable(Payment $payment): void
    {
        $payable = $payment->payable;

        if ($payable instanceof Order) {
            $payable->update(['status' => 'rejected']);
            $payable->items()->update(['status' => 'rejected']);

            foreach ($payable->items as $item) {
                if ($item->physical_copy_id) {
                    $item->physicalCopy?->update(['status' => 'available', 'status_changed_at' => now()]);
                }
            }

            Notification::notify($payable->user_id, 'operation_confirmation', [
                'order_id' => $payable->id, 'kind' => 'purchase', 'decision' => 'rejected',
            ]);
        } elseif ($payable instanceof Borrowing) {
            $payable->update(['status' => 'rejected']);

            if ($payable->physical_copy_id) {
                $payable->physicalCopy?->update(['status' => 'available', 'status_changed_at' => now()]);
            }

            Notification::notify($payable->user_id, 'operation_confirmation', [
                'borrowing_id' => $payable->id, 'kind' => 'borrowing', 'decision' => 'rejected',
            ]);
        } elseif ($payable instanceof Reservation) {
            $payable->update(['status' => 'rejected']);

            Notification::notify($payable->user_id, 'operation_confirmation', [
                'reservation_id' => $payable->id, 'kind' => 'reservation', 'decision' => 'rejected',
            ]);
        }
    }
}
