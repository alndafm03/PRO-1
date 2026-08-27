<?php

namespace App\Services;

use App\Models\Payment;
use Stripe\Checkout\Session as StripeCheckoutSession;
use Stripe\Event as StripeEvent;
use Stripe\StripeClient;
use Stripe\Webhook as StripeWebhook;

class StripePaymentService
{
    private const ZERO_DECIMAL_CURRENCIES = [
        'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
        'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
    ];

    private const THREE_DECIMAL_CURRENCIES = ['bhd', 'jod', 'kwd', 'omr', 'tnd'];

    private StripeClient $client;

    public function __construct()
    {
        $this->client = new StripeClient(config('services.stripe.secret'));
    }

    public function createCheckoutSessionForPayment(Payment $payment, string $description): StripeCheckoutSession
    {
        $currency = $this->settlementCurrency();

        $metadata = [
            'payment_id' => (string) $payment->id,
            'payable_type' => $payment->payable_type,
            'payable_id' => (string) $payment->payable_id,
            'user_id' => (string) $payment->user_id,
        ];

        $session = $this->client->checkout->sessions->create([
            'mode' => 'payment',
            'payment_method_types' => ['card'],
            'customer_email' => $payment->user?->email,
            'line_items' => [[
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => $description,
                    ],
                    'unit_amount' => $this->toMinorUnit((float) $payment->amount, $currency),
                ],
                'quantity' => 1,
            ]],
            'metadata' => $metadata,
            'payment_intent_data' => [
                'metadata' => $metadata,
            ],
            'success_url' => rtrim(config('services.stripe.success_url'), '/') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => config('services.stripe.cancel_url'),
        ]);

        $payment->update([
            'gateway' => 'stripe',
            'currency' => $currency,
            'stripe_checkout_session_id' => $session->id,
        ]);

        return $session;
    }

    public function constructWebhookEvent(string $payload, string $signatureHeader): StripeEvent
    {
        return StripeWebhook::constructEvent(
            $payload,
            $signatureHeader,
            config('services.stripe.webhook_secret')
        );
    }

    public function settlementCurrency(): string
    {
        return strtolower(config('services.stripe.currency') ?: 'usd');
    }

    private function toMinorUnit(float $amount, string $currency): int
    {
        if (in_array($currency, self::ZERO_DECIMAL_CURRENCIES, true)) {
            return (int) round($amount);
        }

        if (in_array($currency, self::THREE_DECIMAL_CURRENCIES, true)) {
            // Stripe requires three-decimal amounts to be a multiple of 10.
            return (int) (round($amount * 1000 / 10) * 10);
        }

        return (int) round($amount * 100);
    }
}
