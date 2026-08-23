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
    /**
     * Create a Stripe Checkout Session (Test Mode) for the pending payment
     * attached to an order / borrowing / reservation, and return the hosted
     * checkout URL for the frontend to redirect the user to.
     */
    public function createCheckoutSession(Request $request)
    {
        $payable = $this->resolvePayable($request);
        $payment = $payable->payments()->pending()->latest()->first();
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
    /**
     * Lightweight status endpoint the frontend can poll right after the
     * Stripe redirect back, in case the webhook hasn't landed yet.
     */
    public function status(Request $request)
    {
        $payable = $this->resolvePayable($request);
        $payment = $payable->payments()->latest()->first();
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
