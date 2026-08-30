<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Borrowing;
use App\Models\Order;
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
                'payment' => new PaymentResource($payment->fresh()),
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
                'currency' => $payment->currency,
                'display_currency' => config('services.stripe.display_currency'),
                'paid_at' => $payment->paid_at,
            ],
        ]);
    }

    public function createFineCheckoutSession(Request $request, Borrowing $borrowing)
    {
        $this->authorize('payFine', $borrowing);

        $payment = $borrowing->payments()->fines()->pending()->latest()->first();

        if (! $payment) {
            abort(404, 'لا توجد عملية دفع غرامة بانتظار الدفع');
        }

        $session = $this->stripe->createCheckoutSessionForPayment(
            $payment,
            'غرامة تأخير: '.($borrowing->book->title ?? $borrowing->id)
        );

        return response()->json([
            'data' => [
                'checkout_url' => $session->url,
                'session_id' => $session->id,
                'payment' => new PaymentResource($payment->fresh()),
            ],
        ]);
    }

    public function fineStatus(Request $request, Borrowing $borrowing)
    {
        $this->authorize('payFine', $borrowing);

        $payment = $borrowing->payments()->fines()->latest()->first();

        if (! $payment) {
            abort(404, 'لا توجد عملية دفع غرامة مرتبطة');
        }

        return response()->json([
            'data' => [
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'display_currency' => config('services.stripe.display_currency'),
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
            return 'إعارة كتاب: '.($payable->book->title ?? $payable->id);
        }
        if ($payable instanceof Reservation) {
            return "حجز مقعد بتاريخ {$payable->reservation_date}";
        }

        return 'دفع عبر المكتبة';
    }

    /**
     * Resolve the polymorphic "payable" (Order / Borrowing / Reservation)
     * targeted by the current route and authorize it.
     *
     * Fix: this used to end with one inline
     * `if ($payable->user_id !== $request->user()->id) abort(403, ...)`
     * check duplicating the exact same rule already written separately for
     * Order, Borrowing and Notification elsewhere in the app. It now
     * delegates to each model's own policy, so the ownership rule for a
     * given model lives in exactly one place.
     */
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

        $this->authorize('view', $payable);

        return $payable;
    }
}
