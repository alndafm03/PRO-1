<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class FineController extends Controller
{
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
        // نظام الغرامات يُطبَّق فقط على الإعارات الورقية (الرقمية يُمنع
        // الوصول إليها تلقائيًا بانتهاء المدة ولا تُغرَّم)، لذا يجب تقييد
        // القائمة "التقديرية" بـ book_type = physical حتى لا تظهر كتب
        // رقمية متأخرة كغرامات مستحقة وهي في الحقيقة غير قابلة للدفع أصلًا.
        $estimated = Borrowing::query()
            ->where('user_id', $userId)
            ->where('book_type', 'physical')
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
    public function payFine(Request $request, Borrowing $borrowing)
    {
        $user = $request->user();
        if ($borrowing->user_id !== $user->id) {
            abort(403, 'هذه الغرامة لا تخصك');
        }
        // نقفل الصف داخل معاملة لمنع سباق يؤدي لإنشاء أكثر من عملية دفع
        // معلّقة لنفس الغرامة عند تكرار الطلب بسرعة من العميل.
        return DB::transaction(function () use ($borrowing, $user) {
            $borrowing = Borrowing::query()->whereKey($borrowing->id)->lockForUpdate()->firstOrFail();
            if ($borrowing->book_type !== 'physical') {
                abort(422, 'نظام الغرامات يُطبَّق فقط على الإعارات الورقية');
            }
            if (! $borrowing->fine_amount || $borrowing->fine_amount <= 0) {
                abort(422, 'لا توجد غرامة مستحقة على هذه الإعارة');
            }
            if ($borrowing->fine_paid) {
                abort(422, 'الغرامة مسدَّدة مسبقًا');
            }
            $payment = $borrowing->payments()->fines()->pending()->latest()->first();
            if (! $payment) {
                $payment = $borrowing->payments()->create([
                    'user_id' => $user->id,
                    'amount' => $borrowing->fine_amount,
                    'status' => 'pending',
                    'purpose' => 'fine',
                ]);
            }
            return response()->json([
                'message' => 'تم إنشاء عملية دفع الغرامة، بانتظار الدفع',
                'data' => $payment,
            ], 201);
        });
    }
}
