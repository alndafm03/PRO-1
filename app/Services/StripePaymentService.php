<?php

namespace App\Services;

use App\Models\Payment;
use Stripe\Checkout\Session as StripeCheckoutSession;
use Stripe\Event as StripeEvent;
use Stripe\StripeClient;
use Stripe\Webhook as StripeWebhook;

/**
 * Thin wrapper around the Stripe SDK. Everything here runs in Stripe TEST
 * MODE as long as the STRIPE_KEY / STRIPE_SECRET in .env are the "sk_test_"
 * / "pk_test_" keys from the Stripe dashboard.
 */
class StripePaymentService
{
    private StripeClient $client;

    public function __construct()
    {
        $this->client = new StripeClient(config('services.stripe.secret'));
    }

    /**
     * Create (or re-create) a Stripe Checkout Session for a pending Payment
     * and store the session id on it so the webhook can find it again.
     */
    public function createCheckoutSessionForPayment(Payment $payment, string $description): StripeCheckoutSession
    {
        $session = $this->client->checkout->sessions->create([
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'customer_email' => $payment->user?->email,
            'line_items' => [[
                'price_data' => [
                    'currency' => $payment->currency ?? 'usd',
                    'product_data' => [
                        'name' => $description,
                    ],
                    // Stripe expects the smallest currency unit (e.g. cents).
                    'unit_amount' => (int) round(((float) $payment->amount) * 100),
                ],
                'quantity' => 1,
            ]],
            'metadata' => [
                'payment_id' => (string) $payment->id,
                'payable_type' => $payment->payable_type,
                'payable_id' => (string) $payment->payable_id,
                'user_id' => (string) $payment->user_id,
            ],
            'success_url' => rtrim(config('services.stripe.success_url'), '/') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => config('services.stripe.cancel_url'),
        ]);

        $payment->update([
            'gateway' => 'stripe',
            'currency' => $payment->currency ?? 'usd',
            'stripe_checkout_session_id' => $session->id,
        ]);

        return $session;
    }

    /**
     * Verify the raw webhook payload against the Stripe signature header and
     * return the parsed event. Throws if the signature is invalid, which the
     * controller turns into a 400 response.
     */
    public function constructWebhookEvent(string $payload, string $signatureHeader): StripeEvent
    {
        return StripeWebhook::constructEvent(
            $payload,
            $signatureHeader,
            config('services.stripe.webhook_secret')
        );
    }
}
