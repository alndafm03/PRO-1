<?php

// احفظ هذا الملف في: config/payments.php

return [
    'pending_expiry_minutes' => (int) env('PAYMENT_PENDING_EXPIRY_MINUTES', 30),
];
