<?php

// احفظ هذا الملف في: config/payments.php

return [
    // عدد الدقائق التي تبقى فيها عملية الدفع (Payment) بحالة pending
    // قبل اعتبارها منتهية الصلاحية تلقائيًا وتحرير أي مورد محجوز (نسخة ورقية / مقعد).
    'pending_expiry_minutes' => (int) env('PAYMENT_PENDING_EXPIRY_MINUTES', 30),
];
