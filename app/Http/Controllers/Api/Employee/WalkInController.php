<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Borrowing\RequestBorrowingRequest;
use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Requests\WalkIn\CreateWalkInPurchaseRequest;
use App\Models\Book;
use App\Models\Borrow_option;
use App\Models\Borrowing;
use App\Models\Order;
use App\Models\Order_items;
use App\Models\PhysicalCopy;
use App\Models\Reservation;
use App\Models\Seat;
use App\Models\System_setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class WalkInController extends Controller
{
    /**
     * FR-27: حساب Walk-in Customer نظامي ثابت — لا تسجيل دخول ولا كلمة مرور فعلية للاستخدام.
     */
    private function walkInCustomer(): User
    {
        return User::where('username', 'walk_in_customer')
            ->where('is_system_account', true)
            ->firstOrFail();
    }

    /**
     * FR-27/FR-28: تسجيل بيع كتاب ورقي مباشر لزائر الشباك. الموظف يتحقق من الدفع لحظيًا وهو
     * نفسه من يسجّل العملية، فتُنشأ مكتملة فورًا (بدون دورة Pending↔Employee Verification المنفصلة
     * المستخدمة بالشراء عبر التطبيق).
     */
    public function createPurchase(CreateWalkInPurchaseRequest $request)
    {
        $employee = $request->user();
        $walkIn = $this->walkInCustomer();
        $book = Book::query()->published()->findOrFail($request->validated('book_id'));

        if (! in_array($book->book_type, ['physical', 'both'], true)) {
            abort(422, 'هذا الكتاب غير متاح للبيع الورقي');
        }

        $quantity = $request->integer('quantity', 1);
        $authorRevenuePercent = (float) System_setting::getValue('author_revenue_percent', 0);

        $order = DB::transaction(function () use ($walkIn, $employee, $book, $quantity, $authorRevenuePercent) {
            $order = Order::create([
                'user_id' => $walkIn->id,
                'is_walk_in' => true,
                'created_by' => $employee->id,
                'status' => 'confirmed',
            ]);

            for ($i = 0; $i < $quantity; $i++) {
                $copy = PhysicalCopy::query()
                    ->forSale()->available()
                    ->where('book_id', $book->id)
                    ->lockForUpdate()
                    ->first();

                if (! $copy) {
                    abort(422, "لا توجد نسخة ورقية متاحة للبيع للكتاب: {$book->title}");
                }

                $copy->update(['status' => 'sold', 'status_changed_at' => now()]);

                $authorSharePercent = $book->author_id !== null ? $authorRevenuePercent : null;
                $authorShareAmount = $authorSharePercent !== null
                    ? round((float) $book->price_physical * $authorSharePercent / 100, 2)
                    : null;

                Order_items::create([
                    'order_id' => $order->id,
                    'book_id' => $book->id,
                    'type' => 'physical',
                    'physical_copy_id' => $copy->id,
                    'price_at_purchase' => $book->price_physical,
                    'author_share_percent_at_purchase' => $authorSharePercent,
                    'author_share_amount_at_purchase' => $authorShareAmount,
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);
            }

            $order->recalculateTotal();

            $order->payments()->create([
                'user_id' => $walkIn->id,
                'amount' => $order->total_amount,
                'status' => 'verified',
            ]);

            return $order;
        });

        return response()->json([
            'message' => 'تم تسجيل عملية البيع بنجاح',
            'data' => $order->load('items.book', 'payments'),
        ], 201);
    }

    /**
     * FR-27/FR-28: تسجيل إعارة ورقية مباشرة لزائر الشباك — تُفعَّل فورًا لنفس سبب الشراء أعلاه.
     */
    public function createBorrowing(RequestBorrowingRequest $request)
    {
        $employee = $request->user();
        $walkIn = $this->walkInCustomer();
        $book = Book::query()->published()->findOrFail($request->validated('book_id'));
        $option = Borrow_option::where('book_id', $book->id)->findOrFail($request->validated('borrow_option_id'));

        if ($option->physical_price === null) {
            abort(422, 'هذا الخيار غير متاح للإعارة الورقية');
        }

        $borrowing = DB::transaction(function () use ($walkIn, $employee, $book, $option) {
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
                'user_id' => $walkIn->id,
                'created_by' => $employee->id,
                'is_walk_in' => true,
                'book_id' => $book->id,
                'book_type' => 'physical',
                'physical_copy_id' => $copy->id,
                'borrow_option_id' => $option->id,
                'duration_days' => $option->duration_days,
                'price' => $option->physical_price,
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays($option->duration_days)->toDateString(),
            ]);

            $borrowing->payments()->create([
                'user_id' => $walkIn->id,
                'amount' => $option->physical_price,
                'status' => 'verified',
            ]);

            return $borrowing;
        });

        return response()->json([
            'message' => 'تم تسجيل الإعارة بنجاح',
            'data' => $borrowing->load('payments'),
        ], 201);
    }

    /**
     * FR-27/FR-28/BR-14/BR-15: تسجيل حجز مقعد مباشر لزائر — يُؤكَّد فورًا لنفس السبب أعلاه.
     */
    public function createReservation(StoreReservationRequest $request)
    {
        $employee = $request->user();
        $walkIn = $this->walkInCustomer();
        $date = $request->validated('reservation_date');
        $period = $request->validated('period');
        $seatsCount = $request->validated('seats_count');

        $reservation = DB::transaction(function () use ($walkIn, $employee, $date, $period, $seatsCount) {
            $totalSeats = Seat::count();
            $reservedSeats = (int) Reservation::forSlot($date, $period)->occupying()->lockForUpdate()->sum('seats_count');
            $available = $totalSeats - $reservedSeats;

            if ($seatsCount > $available) {
                abort(422, "العدد المطلوب غير متاح، المقاعد المتاحة حاليًا: {$available}");
            }

            $pricePerSeat = (float) System_setting::getValue('seat_reservation_price_per_seat', 0);
            $price = round($pricePerSeat * $seatsCount, 2);

            $reservation = Reservation::create([
                'user_id' => $walkIn->id,
                'created_by' => $employee->id,
                'is_walk_in' => true,
                'reservation_date' => $date,
                'period' => $period,
                'seats_count' => $seatsCount,
                'price' => $price,
                'status' => 'confirmed',
            ]);

            $reservation->payments()->create([
                'user_id' => $walkIn->id,
                'amount' => $price,
                'status' => 'verified',
            ]);

            return $reservation;
        });

        return response()->json([
            'message' => 'تم تسجيل الحجز بنجاح',
            'data' => $reservation->load('payments'),
        ], 201);
    }

    /**
     * FR-29: إحصائيات عمليات Walk-in (مبيعات/إعارات/حجوزات).
     */
    public function stats()
    {
        return response()->json([
            'data' => [
                'sales' => Order::where('is_walk_in', true)->where('status', 'confirmed')->count(),
                'borrowings' => Borrowing::where('is_walk_in', true)->whereIn('status', ['active', 'returned', 'expired'])->count(),
                'reservations' => Reservation::where('is_walk_in', true)->where('status', 'confirmed')->count(),
            ],
        ]);
    }
}
