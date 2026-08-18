<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seat\StoreSeatRequest;
use App\Models\Reservation;
use App\Models\Seat;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    /**
     * FR-60: عرض إجمالي/محجوز/متاح المقاعد لتاريخ وفترة محددين (اليوم والفترة الحالية افتراضيًا).
     */
    public function availability(Request $request)
    {
        $date = $request->input('date', now()->toDateString());
        $period = $request->input('period', $this->currentPeriod());

        $total = Seat::count();
        $reserved = (int) Reservation::forSlot($date, $period)->occupying()->sum('seats_count');

        return response()->json([
            'data' => [
                'date' => $date,
                'period' => $period,
                'total' => $total,
                'reserved' => $reserved,
                'available' => max(0, $total - $reserved),
            ],
        ]);
    }

    /**
     * FR-57: عرض قائمة المقاعد المعرفة بالنظام (Library Employee).
     */
    public function index(Request $request)
    {
        $seats = Seat::query()->latest()->paginate($request->integer('per_page', 50));

        return response()->json(['data' => $seats]);
    }

    /**
     * FR-57: إضافة مقعد جديد للنظام (Library Employee).
     */
    public function store(StoreSeatRequest $request)
    {
        $seat = Seat::create($request->validated());

        return response()->json(['message' => 'تمت إضافة المقعد بنجاح', 'data' => $seat], 201);
    }

    /**
     * FR-57: حذف مقعد من النظام (Library Employee).
     */
    public function destroy(Seat $seat)
    {
        $seat->delete();

        return response()->json(['message' => 'تم حذف المقعد بنجاح']);
    }

    /**
     * FR-59: الفترتان الثابتتان يوميًا: period_1 = 00:00-12:00، period_2 = 12:00-00:00.
     */
    private function currentPeriod(): string
    {
        return now()->hour < 12 ? 'period_1' : 'period_2';
    }
}
