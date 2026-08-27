<?php

// احفظ هذا الملف في: app/Console/Commands/ExpireStalePayments.php

namespace App\Console\Commands;

use App\Models\Borrowing;
use App\Models\Payment;
use App\Services\PaymentActivationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ExpireStalePayments extends Command
{
    protected $signature = 'payments:expire-stale';

    protected $description = 'إلغاء عمليات الدفع المعلّقة (pending) التي تجاوزت المهلة، '
        . 'وتحرير أي موارد محجوزة (نسخ ورقية / مقاعد)، وإنهاء الإعارات الرقمية منتهية المدة';

    public function handle(PaymentActivationService $activation): int
    {
        $this->expireStalePayments($activation);
        $this->expireOverdueDigitalBorrowings();

        return self::SUCCESS;
    }

    private function expireStalePayments(PaymentActivationService $activation): void
    {
        $expiryMinutes = (int) config('payments.pending_expiry_minutes', 30);
        Payment::query()
            ->where('status', 'pending')
            ->where(function ($query) use ($expiryMinutes) {
                $query->where('expires_at', '<', now())
                    ->orWhere(function ($q) use ($expiryMinutes) {
                        $q->whereNull('expires_at')
                            ->where('created_at', '<', now()->subMinutes($expiryMinutes));
                    });
            })
            ->chunkById(100, function ($payments) use ($activation) {
                foreach ($payments as $payment) {
                    try {
                        $activation->markFailed($payment, 'انتهت مهلة الدفع دون إتمام العملية');
                    } catch (\Throwable $e) {
                        Log::error('فشل إلغاء عملية دفع منتهية الصلاحية', [
                            'payment_id' => $payment->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });
    }

    private function expireOverdueDigitalBorrowings(): void
    {
        Borrowing::query()
            ->where('status', 'active')
            ->where('book_type', 'digital')
            ->whereDate('end_date', '<', now())
            ->chunkById(200, function ($borrowings) {
                foreach ($borrowings as $borrowing) {
                    $borrowing->update(['status' => 'expired']);
                }
            });
    }
}
