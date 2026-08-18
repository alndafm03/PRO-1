<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use App\Models\Order;
use App\Models\Reservation;
use App\Models\System_setting;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * FR-19: عرض رمز QR الثابت (Sham Cash) + المبلغ المطلوب، لعملية Order/Borrowing/Reservation.
     * النظام لا يتصل مباشرة بـSham Cash — فقط يعرض نفس صورة QR الثابتة والمبلغ.
     */
    public function showQrCode(Request $request)
    {
        $payable = $this->resolvePayable($request);
        $payment = $payable->payments()->latest()->first();

        if (! $payment) {
            abort(404, 'لا توجد عملية دفع مرتبطة');
        }

        return response()->json([
            'data' => [
                'qr_code' => System_setting::getValue('payment_qr_code'),
                'amount' => (float) $payment->amount,
                'payment_status' => $payment->status,
            ],
        ]);
    }

    /**
     * FR-19/FR-20/BR-08: إشعار النظام بأن المستخدم دفع خارجيًا. لا يغيّر حالة الدفع تلقائيًا —
     * تبقى pending لحد ما يتحقق Library Employee يدويًا وبقبل/يرفض.
     */
    public function markUserPaidExternally(Request $request)
    {
        $payable = $this->resolvePayable($request);
        $payment = $payable->payments()->pending()->latest()->first();

        if (! $payment) {
            abort(404, 'لا توجد عملية دفع بانتظار التحقق');
        }

        // TODO: عند بناء دفعة الإشعارات (Notifications)، أرسل إشعارًا لـLibrary Employee هون.
        return response()->json(['message' => 'تم إشعار النظام بالدفع، بانتظار تحقق الموظف', 'data' => $payment]);
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
