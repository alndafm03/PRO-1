<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use Illuminate\Http\Request;
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
    /**
     * ينشئ عملية دفع (Payment) بحالة "pending" لغرامة تأخير محددة تخص المستخدم،
     * تمهيدًا لإنشاء جلسة دفع Stripe عبر PaymentController::createFineCheckoutSession.
     */
    public function payFine(Request $request, Borrowing $borrowing)
    {
        $user = $request->user();
        if ($borrowing->user_id !== $user->id) {
            abort(403, 'هذه الغرامة لا تخصك');
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
    }
}
