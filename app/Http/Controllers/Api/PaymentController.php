<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Reservation;
use App\Services\StripePaymentService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
class PaymentController extends Controller
{
    public function __construct(private readonly StripePaymentService $stripe)
    {
    }
    public function createCheckoutSession(Request $request)
    {
        $payable = $this->resolvePayable($request);
        $payment = $payable->payments()->primary()->pending()->latest()->first();
        if (! $payment) {
            abort(404, 'لا توجد عملية دفع بانتظار الدفع');
        }
        $session = $this->stripe->createCheckoutSessionForPayment(
            $payment,
            $this->describePayable($payable)
        );
        return response()->json([
            'data' => [
                'checkout_url' => $session->url,
                'session_id' => $session->id,
                'payment' => $payment->fresh(),
            ],
        ]);
    }
    public function status(Request $request)
    {
        $payable = $this->resolvePayable($request);
        $payment = $payable->payments()->primary()->latest()->first();
        if (! $payment) {
            abort(404, 'لا توجد عملية دفع مرتبطة');
        }
        return response()->json([
            'data' => [
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'paid_at' => $payment->paid_at,
            ],
        ]);
    }
    public function createFineCheckoutSession(Request $request, Borrowing $borrowing)
    {
        if ($borrowing->user_id !== $request->user()->id) {
            abort(403, 'هذه الغرامة لا تخصك');
        }
        $payment = $borrowing->payments()->fines()->pending()->latest()->first();
        if (! $payment) {
            abort(404, 'لا توجد عملية دفع غرامة بانتظار الدفع');
        }
        $session = $this->stripe->createCheckoutSessionForPayment(
            $payment,
            'غرامة تأخير: ' . ($borrowing->book->title ?? $borrowing->id)
        );
        return response()->json([
            'data' => [
                'checkout_url' => $session->url,
                'session_id' => $session->id,
                'payment' => $payment->fresh(),
            ],
        ]);
    }
    public function fineStatus(Request $request, Borrowing $borrowing)
    {
        if ($borrowing->user_id !== $request->user()->id) {
            abort(403, 'هذه الغرامة لا تخصك');
        }
        $payment = $borrowing->payments()->fines()->latest()->first();
        if (! $payment) {
            abort(404, 'لا توجد عملية دفع غرامة مرتبطة');
        }
        return response()->json([
            'data' => [
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'paid_at' => $payment->paid_at,
            ],
        ]);
    }
    private function describePayable(Model $payable): string
    {
        if ($payable instanceof Order) {
            return "طلب شراء رقم #{$payable->id}";
        }
        if ($payable instanceof Borrowing) {
            return 'إعارة كتاب: ' . ($payable->book->title ?? $payable->id);
        }
        if ($payable instanceof Reservation) {
            return "حجز مقعد بتاريخ {$payable->reservation_date}";
        }
        return 'دفع عبر المكتبة';
    }
    private function resolvePayable(Request $request): Model
    {
        if ($orderId = $request->route('order')) {
            $payable = Order::findOrFail($orderId);
        } elseif ($borrowingId = $request->route('borrowing')) {
            $payable = Borrowing::findOrFail($borrowingId);
        } elseif ($reservationId = $request->route('reservation')) {
            $payable = Reservation::findOrFail($reservationId);
        } else {
            abort(404);
        }
        if ($payable->user_id !== $request->user()->id) {
            abort(403, 'هذه العملية لا تخصك');
        }
        return $payable;
    }
}
