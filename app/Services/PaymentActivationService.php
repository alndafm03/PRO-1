<?php
namespace App\Services;
use App\Models\Borrowing;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\System_setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
class PaymentActivationService
{
    public function markPaid(Payment $payment, ?string $paymentIntentId = null, string $gateway = 'stripe'): Payment
    {
        return DB::transaction(function () use ($payment, $paymentIntentId, $gateway) {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            if ($payment->status === 'verified') {
                return $payment; // already processed, e.g. duplicate webhook
            }
            if ($payment->status !== 'pending') {
                Log::warning('Stripe: attempted to mark a non-pending payment as paid', [
                    'payment_id' => $payment->id,
                    'current_status' => $payment->status,
                ]);
                return $payment;
            }
            $payment->markAsPaid($paymentIntentId ?? '', $gateway);
            $this->activatePayable($payment);
            return $payment->fresh();
        });
    }
    public function markFailed(Payment $payment, ?string $reason = null): Payment
    {
        return DB::transaction(function () use ($payment, $reason) {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            if (! in_array($payment->status, ['pending'], true)) {
                return $payment; // already decided, nothing to undo
            }
            $payment->markAsFailed($reason);
            $this->rejectPayable($payment);
            return $payment->fresh();
        });
    }
    public function activatePayable(Payment $payment): void
    {
        $payable = $payment->payable;
        if ($payable instanceof Order) {
            $payable->update(['status' => 'confirmed']);
            $payable->items()->update(['status' => 'confirmed']);
            Notification::notify($payable->user_id, 'operation_confirmation', [
                'order_id' => $payable->id, 'kind' => 'purchase', 'decision' => 'approved',
            ]);
        } elseif ($payable instanceof Borrowing) {
            if ($payment->purpose === 'fine') {
                $payable->update(['fine_paid' => true]);
                Notification::notify($payable->user_id, 'fine_payment_confirmation', [
                    'borrowing_id' => $payable->id, 'kind' => 'fine', 'decision' => 'approved',
                ]);
                return;
            }
            $authorRevenuePercent = (float) System_setting::getValue('author_revenue_percent', 0);
            $authorSharePercent = $payable->book?->author_id !== null ? $authorRevenuePercent : null;
            $authorShareAmount = $authorSharePercent !== null
                ? round((float) $payable->price * $authorSharePercent / 100, 2)
                : null;
            $payable->update([
                'status' => 'active',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays($payable->duration_days)->toDateString(),
                'author_revenue_percent_snapshot' => $authorSharePercent,
                'author_share_amount' => $authorShareAmount,
            ]);
            Notification::notify($payable->user_id, 'operation_confirmation', [
                'borrowing_id' => $payable->id, 'kind' => 'borrowing', 'decision' => 'approved',
            ]);
        } elseif ($payable instanceof Reservation) {
            $payable->update(['status' => 'confirmed']);
            Notification::notify($payable->user_id, 'operation_confirmation', [
                'reservation_id' => $payable->id, 'kind' => 'reservation', 'decision' => 'approved',
            ]);
        }
    }
    public function rejectPayable(Payment $payment): void
    {
        $payable = $payment->payable;
        if ($payable instanceof Order) {
            $payable->update(['status' => 'rejected']);
            $payable->items()->update(['status' => 'rejected']);
            foreach ($payable->items as $item) {
                if ($item->physical_copy_id) {
                    $item->physicalCopy?->update(['status' => 'available', 'status_changed_at' => now()]);
                }
            }
            Notification::notify($payable->user_id, 'operation_confirmation', [
                'order_id' => $payable->id, 'kind' => 'purchase', 'decision' => 'rejected',
            ]);
        } elseif ($payable instanceof Borrowing) {
            if ($payment->purpose === 'fine') {
                Notification::notify($payable->user_id, 'fine_payment_confirmation', [
                    'borrowing_id' => $payable->id, 'kind' => 'fine', 'decision' => 'rejected',
                ]);
                return;
            }
            $payable->update(['status' => 'rejected']);
            if ($payable->physical_copy_id) {
                $payable->physicalCopy?->update(['status' => 'available', 'status_changed_at' => now()]);
            }
            Notification::notify($payable->user_id, 'operation_confirmation', [
                'borrowing_id' => $payable->id, 'kind' => 'borrowing', 'decision' => 'rejected',
            ]);
        } elseif ($payable instanceof Reservation) {
            $payable->update(['status' => 'rejected']);
            Notification::notify($payable->user_id, 'operation_confirmation', [
                'reservation_id' => $payable->id, 'kind' => 'reservation', 'decision' => 'rejected',
            ]);
        }
    }
}
