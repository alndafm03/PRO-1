<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use Illuminate\Http\Request;

class FineController extends Controller
{
    /**
     * FR-31/FR-32/FR-33: عرض الغرامات المستحقة على المستخدم — غرامات نهائية غير مسددة
     * (احتُسبت عند الإرجاع)، بالإضافة إلى تقدير حي للإعارات النشطة المتأخرة حاليًا.
     */
    public function myFines(Request $request)
    {
        $userId = $request->user()->id;

        $finalized = Borrowing::query()
            ->where('user_id', $userId)
            ->whereNotNull('fine_amount')
            ->where('fine_amount', '>', 0)
            ->where('fine_paid', false)
            ->with('book')
            ->get()
            ->map(fn (Borrowing $b) => [
                'borrowing_id' => $b->id,
                'book' => $b->book,
                'amount' => (float) $b->fine_amount,
                'days_late' => $b->fine_days_late,
                'is_estimated' => false,
            ]);

        $estimated = Borrowing::query()
            ->where('user_id', $userId)
            ->overdueCandidates()
            ->with('book')
            ->get()
            ->map(fn (Borrowing $b) => [
                'borrowing_id' => $b->id,
                'book' => $b->book,
                'amount' => $b->calculateFine(),
                'days_late' => $b->daysLateAttribute(),
                'is_estimated' => true,
            ]);

        $fines = $finalized->concat($estimated)->values();

        return response()->json([
            'data' => [
                'fines' => $fines,
                'total_due' => round((float) $fines->sum('amount'), 2),
            ],
        ]);
    }
}
