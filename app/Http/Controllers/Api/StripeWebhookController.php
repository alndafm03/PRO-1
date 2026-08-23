<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaymentActivationService;
use App\Services\StripePaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use UnexpectedValueException;
use Stripe\Exception\SignatureVerificationException;

/**
 * Handles Stripe webhook callbacks. This is the piece that makes the whole
 * flow automatic: the moment Stripe confirms a checkout succeeded (or
 * failed), we update the Payment and activate/reject the underlying
 * order / borrowing / reservation ourselves — no library employee involved.
 *
 * Route MUST be public (no auth:sanctum) and MUST be excluded from CSRF,
 * since the caller is Stripe's servers, not a logged-in user.
 */
class StripeWebhookController extends Controller
{
    public function __construct(
        private readonly StripePaymentService $stripe,
        private readonly PaymentActivationService $activation,
    ) {
    }
    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature', '');
        try {
            $event = $this->stripe->constructWebhookEvent($payload, $signature);
        } catch (UnexpectedValueException|SignatureVerificationException $e) {
            Log::warning('Stripe webhook signature verification failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Invalid signature'], Response::HTTP_BAD_REQUEST);
        }
        match ($event->type) {
            'checkout.session.completed', 'checkout.session.async_payment_succeeded' => $this->handleCheckoutSucceeded($event),
            'checkout.session.expired', 'checkout.session.async_payment_failed' => $this->handleCheckoutFailed($event),
            'payment_intent.payment_failed' => $this->handlePaymentIntentFailed($event),
            default => Log::info('Stripe webhook: unhandled event type', ['type' => $event->type]),
        };
        return response()->json(['message' => 'ok']);
    }
    private function handleCheckoutSucceeded(\Stripe\Event $event): void
    {
        $session = $event->data->object;
        $payment = $this->findPaymentFromSession($session);
        if (! $payment) {
            return;
        }
        if ($session->payment_status !== 'paid') {
            // e.g. still pending an async payment method; wait for the
            // async_payment_succeeded / async_payment_failed event instead.
            return;
        }
        $this->activation->markPaid($payment, (string) ($session->payment_intent ?? ''));
    }
    private function handleCheckoutFailed(\Stripe\Event $event): void
    {
        $session = $event->data->object;
        $payment = $this->findPaymentFromSession($session);
        if (! $payment) {
            return;
        }
        $this->activation->markFailed($payment, 'انتهت صلاحية جلسة الدفع أو فشلت عبر Stripe');
    }
    private function handlePaymentIntentFailed(\Stripe\Event $event): void
    {
        $intent = $event->data->object;
        $paymentId = $intent->metadata->payment_id ?? null;
        if (! $paymentId) {
            return;
        }
        $payment = Payment::find($paymentId);
        if (! $payment) {
            return;
        }
        $reason = $intent->last_payment_error->message ?? 'فشلت عملية الدفع عبر Stripe';
        $this->activation->markFailed($payment, $reason);
    }
    private function findPaymentFromSession(object $session): ?Payment
    {
        $paymentId = $session->metadata->payment_id ?? null;
        if ($paymentId && $payment = Payment::find($paymentId)) {
            return $payment;
        }
        // Fallback in case metadata is ever missing: match by session id.
        return Payment::where('stripe_checkout_session_id', $session->id ?? null)->first();
    }
}
