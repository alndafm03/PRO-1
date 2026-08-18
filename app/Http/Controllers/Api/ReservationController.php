<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Models\Reservation;
use App\Models\Seat;
use App\Models\System_setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    /**
     * FR-58: عرض حجوزات المقاعد الخاصة بالمستخدم.
     */
    public function myReservations(Request $request)
    {
        $reservations = $request->user()->reservations()
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $reservations]);
    }

    /**
     * FR-58/FR-59/FR-60/BR-14/BR-15: حجز عدد مقاعد ضمن إحدى الفترتين الثابتتين ليوم محدد.
     * السعر = عدد المقاعد × سعر المقعد الواحد (إعداد نظام payment_qr_code-مشابه: seat_reservation_price_per_seat،
     * لا يوجد مصدر آخر موثّق لسعر الحجز بالمتطلبات).
     */
    public function store(StoreReservationRequest $request)
    {
        $user = $request->user();
        $date = $request->validated('reservation_date');
        $period = $request->validated('period');
        $seatsCount = $request->validated('seats_count');

        $reservation = DB::transaction(function () use ($user, $date, $period, $seatsCount) {
            $totalSeats = Seat::count();

            // ملاحظة: القفل هون بيقفل الصفوف الموجودة فعليًا بنفس الـslot، وهاد كافٍ لمعظم
            // حالات التزامن العملية بمشروع بهاد الحجم؛ ما في حماية كاملة من phantom rows
            // لسلوت فاضي تمامًا (لا يوجد صف يُقفل عليه أصلًا).
            $reservedSeats = (int) Reservation::forSlot($date, $period)->occupying()->lockForUpdate()->sum('seats_count');
            $available = $totalSeats - $reservedSeats;

            if ($seatsCount > $available) {
                abort(422, "العدد المطلوب غير متاح، المقاعد المتاحة حاليًا: {$available}");
            }

            $pricePerSeat = (float) System_setting::getValue('seat_reservation_price_per_seat', 0);
            $price = round($pricePerSeat * $seatsCount, 2);

            $reservation = Reservation::create([
                'user_id' => $user->id,
                'created_by' => $user->id,
                'is_walk_in' => false,
                'reservation_date' => $date,
                'period' => $period,
                'seats_count' => $seatsCount,
                'price' => $price,
                'status' => 'pending',
            ]);

            $reservation->payments()->create([
                'user_id' => $user->id,
                'amount' => $price,
                'status' => 'pending',
            ]);

            return $reservation;
        });

        return response()->json([
            'message' => 'تم إنشاء طلب الحجز، بانتظار الدفع',
            'data' => $reservation->load('payments'),
        ], 201);
    }
}
