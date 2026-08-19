<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\ProfileController;

use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\FavoriteController;

use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;

use App\Http\Controllers\Api\BorrowingController;
use App\Http\Controllers\Api\FineController;

use App\Http\Controllers\Api\SeatController;
use App\Http\Controllers\Api\ReservationController;

use App\Http\Controllers\Api\AuthorRequestController;
use App\Http\Controllers\Api\AuthorBookController;
use App\Http\Controllers\Api\AuthorEarningController;

use App\Http\Controllers\Api\BookFeedbackController;
use App\Http\Controllers\Api\UserActivityController;
use App\Http\Controllers\Api\RecommendationController;

use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\NotificationController;

use App\Http\Controllers\Api\Employee\LibraryEmployeeController;
use App\Http\Controllers\Api\Employee\WalkInController;
use App\Http\Controllers\Api\Employee\AuthorContentEmployeeController;

use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminEmployeeController;
use App\Http\Controllers\Api\Admin\AdminAuthorController;
use App\Http\Controllers\Api\Admin\AdminBookController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\AdminSettingsController;

// Guest—تصفح عام بدون تسجيل دخول
Route::prefix('books')->group(function () {
    Route::get('/', [BookController::class, 'index']);                             // عرض قائمة جميع الكتب
    Route::get('/{book}', [BookController::class, 'show']);                        // عرض التفاصيل لكتاب محدد
    Route::get('/{book}/reviews', [BookFeedbackController::class, 'index']);     // مشاهدة تقييمات ومراجعات كتاب
    Route::get('/{book}/availability', [BookController::class, 'availability']); // التحقق من توفر النسخة الورقية للكتاب
});

Route::get('/categories', [CategoryController::class, 'index']);                      // عرض قائمة جميع التصنيفات والأقسام
Route::get('/categories/{category}/books', [CategoryController::class, 'books']);      // عرض جميع الكتب التابعة لقسم محدد

Route::get('/authors/{user}', [BookController::class, 'authorProfile']);               // عرض البروفايل العام للمؤلف وكتبه المنشورة

Route::get('/offers', [OfferController::class, 'index']);                             // عرض التخفيضات والعروض المتاحة حالياً

Route::get('/search', [SearchController::class, 'search']);                           // البحث (في الكتب والمؤلفين والأقسام)
Route::get('/filter/books', [SearchController::class, 'filterBooks']);                // تصفية الكتب (حسب اللغة والنوع والتقييم)

Route::get('/library/info', [AdminSettingsController::class, 'publicInfo']);           // عرض المعلومات العامة عن المكتبة (ما ضروري)

// Auth — تسجيل / دخول / خروج / إعادة ضبط كلمة المرور
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);                    // إنشاء حساب جديد لإنشاء مستخدم
    Route::post('/login', [AuthController::class, 'login']);                          // تسجيل الدخول والحصول على توكن الوصول

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);                    // تسجيل الخروج وإلغاء صلاحية التوكن الحالي
    });
});

//تتطلب تسجيل دخول
Route::middleware('auth:sanctum')->group(function () {

    // Profile — إدارة الملف الشخصي
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);                          // عرض بيانات حساب المستخدم الحالي
        Route::put('/', [ProfileController::class, 'update']);                        // تعديل البيانات الشخصية (الاسم، الهاتف...)
        Route::post('/avatar', [ProfileController::class, 'updateAvatar']);           // رفع أو تغيير الصورة الشخصية
        Route::put('/password', [ProfileController::class, 'updatePassword']);        // تغيير كلمة المرور للمستخدم
        Route::delete('/', [ProfileController::class, 'destroy']);                    // حذف الحساب (بعد التأكد من عدم وجود التزامات مالية أو إعارات)
    });

    Route::prefix('favorites')->group(function () {
        Route::get('/', [FavoriteController::class, 'index']);                        // عرض قائمة الكتب المضافة للمفضلة
        Route::post('/{book}', [FavoriteController::class, 'store']);                 // إضافة كتاب محدد إلى المفضلة
        Route::delete('/{book}', [FavoriteController::class, 'destroy']);             // إزالة كتاب محدد من المفضلة
    });

    // Cart & Orders — سلة المشتريات والطلبات والدفع
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);                            // عرض محتويات سلة الشراء المؤقتة
        Route::post('/items', [CartController::class, 'addItem']);                    // إضافة كتاب (ورقي/رقمي) إلى السلة
        Route::put('/items/{item}', [CartController::class, 'updateItem']);           // تعديل الكمية أو نوع النسخة لعنصر بالسلة
        Route::delete('/items/{item}', [CartController::class, 'removeItem']);        // حذف عنصر محدد من السلة
        Route::post('/checkout', [OrderController::class, 'checkout']);               // تحويل عناصر السلة إلى طلب شراء فعلي (Checkout)
    });

    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);                           // عرض قائمة طلبات الشراء الخاصة بالمستخدم
        Route::get('/{order}', [OrderController::class, 'show']);                     // عرض تفاصيل طلب شراء محدد
        Route::get('/{order}/payment-info', [PaymentController::class, 'showQrCode']);// عرض رمز QR والمعلومات اللازمة للدفع عبر Sham Cash
        Route::post('/{order}/confirm-external-payment', [PaymentController::class, 'markUserPaidExternally']); // إشعار النظام بتأكيد الدفع الخارجي من قبل المستخدم
        Route::post('/order-items/{orderItem}/receive', [OrderController::class, 'markCompleted']); // تأكيد استلام العنصر الورقي وتحويل حالته لمكتمل
    });

    Route::get('/purchases/digital/{book}/read', [BookController::class, 'readDigital']); // فتح واجهة قراءة الكتاب الرقمي المشترى
    Route::get('/purchases', [OrderController::class, 'myPurchases']);               // عرض جميع المشتريات الرقمية الخاصة بالمستخدم

    // Borrowings — إعارة الكتب (ورقي/رقمي)
    Route::prefix('borrowings')->group(function () {
        Route::get('/', [BorrowingController::class, 'index']);                       // عرض سجل وطلبات الإعارة الخاصة بالمستخدم
        Route::get('/{borrowing}', [BorrowingController::class, 'show']);             // عرض تفاصيل عملية إعارة محددة
        Route::post('/physical', [BorrowingController::class, 'requestPhysical']);    // تقديم طلب إعارة لنسخة ورقية
        Route::post('/digital', [BorrowingController::class, 'requestDigital']);      // تقديم طلب إعارة لنسخة رقمية
        Route::get('/{borrowing}/payment-info', [PaymentController::class, 'showQrCode']); // عرض رمز QR لتسديد رسوم الإعارة
        Route::post('/{borrowing}/confirm-external-payment', [PaymentController::class, 'markUserPaidExternally']); // تأكيد دفع رسوم الإعارة خارجياً
        Route::post('/{borrowing}/renew', [BorrowingController::class, 'renew']);      // طلب تمديد/تجديد فترة الإعارة
        Route::get('/{borrowing}/read', [BorrowingController::class, 'readDigital']);  // قراءة الكتاب الرقمي المستعار خلال فترة الإعارة
        Route::get('/book/{book}/options', [BorrowingController::class, 'options']);  // استعلام عن خيارات ومدد الإعارة المتاحة للكتاب
    });

    // Fines — الغرامات المالية
    Route::get('/fines', [FineController::class, 'myFines']);                         // عرض الغرامات المالية المستحقة بسبب التأخير

    // Reservations — حجز مقاعد القراءة
    Route::get('/seats/availability', [SeatController::class, 'availability']);       // الاستعلام عن المقاعد المتاحة في القاعة
    Route::prefix('reservations')->group(function () {
        Route::get('/', [ReservationController::class, 'myReservations']);           // عرض حجوزات المقاعد الخاصة بالمستخدم
        Route::post('/', [ReservationController::class, 'store']);                    // حجز مقعد قراءة جديد
        Route::get('/{reservation}/payment-info', [PaymentController::class, 'showQrCode']); // عرض رمز QR لتسديد رسوم حجز المقعد
        Route::post('/{reservation}/confirm-external-payment', [PaymentController::class, 'markUserPaidExternally']); // تأكيد دفع رسوم الحجز خارجياً
    });

    // Ratings & Reviews — التقييمات والمراجعات
    Route::prefix('books/{book}')->group(function () {
        Route::post('/rating', [BookFeedbackController::class, 'rate']);              // تقييم الكتاب بالنجوم (من 1 إلى 5)
        Route::put('/rating', [BookFeedbackController::class, 'updateRating']);       // تعديل تقييم النجوم الممنوح سابقاً
        Route::post('/review', [BookFeedbackController::class, 'review']);            // إضافة مراجعة ونص رأي حول الكتاب
        Route::put('/review', [BookFeedbackController::class, 'updateReview']);        // تعديل نص المراجعة
        Route::delete('/review', [BookFeedbackController::class, 'deleteReview']);    // حذف مراجعة المستخدم
    });

    // Recommendations — التوصيات
    Route::get('/recommendations', [RecommendationController::class, 'forUser']);     // جلب ترشيحات كتب مخصصة بناءً على تفضيلات المستخدم

    // Notifications — الإشعارات
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);                    // عرض قائمة جميع الإشعارات الواردة
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead']); // تحديد إشعار محدد كـ "تمت القراءة"
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);   // تحديد كافة الإشعارات كـ "تمت القراءة"
    });

    // Author Application — طلب الترشح للانضمام كمؤلف
    Route::prefix('author-requests')->group(function () {
        Route::get('/', [AuthorRequestController::class, 'myRequests']);              // عرض حالة طلبات الانضمام كمؤلف المقدمة سابقاً
        Route::post('/', [AuthorRequestController::class, 'apply']);                  // تقديم طلب جديد للترقية إلى حساب مؤلف
        Route::get('/{authorRequest}', [AuthorRequestController::class, 'show']);     // عرض تفاصيل طلب انضمام محدد
        Route::delete('/{authorRequest}', [AuthorRequestController::class, 'cancel']);// إلغاء طلب الانضمام كمؤلف sebelum معالجته
    });

    // Author Portal — بوابة المؤلف (خاصة بالمؤلفين المعتمدين)
    Route::middleware('role:author')->prefix('author')->group(function () {
        Route::prefix('books')->group(function () {
            Route::get('/', [AuthorBookController::class, 'index']);                  // عرض قائمة الكتب المرفوعة بواسطة هذا المؤلف
            Route::post('/', [AuthorBookController::class, 'store']);                 // إنشاء مسودة كتاب جديد (Draft)
            Route::get('/{book}', [AuthorBookController::class, 'show']);             // عرض تفاصيل كتاب محدد للمؤلف
            Route::put('/{book}', [AuthorBookController::class, 'updateDraft']);      // تعديل بيانات مسودة الكتاب قبل التقديم
            Route::post('/{book}/submit', [AuthorBookController::class, 'submit']);   // إرسال المسودة للمراجعة والنشر (Draft -> Submitted)
            Route::post('/{book}/modification-requests', [AuthorBookController::class, 'requestModification']); // طلب إجراء تعديل على كتاب منشور
        });

        Route::get('/earnings', [AuthorEarningController::class, 'index']);           // عرض إجمالي أرباح ونسب مبيعات المؤلف
        Route::get('/earnings/{book}', [AuthorEarningController::class, 'forBook']);  // عرض أرباح ومبيعات كتاب محدد للمؤلف
    });
});

// Library Employee — لوحة عمل موظف المكتبة الفيزيائية
Route::middleware(['auth:sanctum', 'role:library_employee'])
    ->prefix('employee/library')
    ->group(function () {

        // إدارة التحقق من المدفوعات
        Route::get('/payments/pending', [LibraryEmployeeController::class, 'pendingPayments']); // عرض عمليات الدفع التي تنتظر تأكيد الموظف
        Route::post('/payments/{payment}/approve', [LibraryEmployeeController::class, 'approvePayment']); // قبول عملية الدفع وتأكيد الحجز/الشراء
        Route::post('/payments/{payment}/reject', [LibraryEmployeeController::class, 'rejectPayment']);   // رفض عملية الدفع عند وجود مشكلة

        // تجهيز طلبيات الشراء الورقية
        Route::post('/order-items/{orderItem}/mark-ready', [LibraryEmployeeController::class, 'markOrderItemReady']); // تغيير حالة طلب الكتاب الورقي إلى "جاهز للاستلام"

        // إدارة عمليات الإعارة والإرجاع
        Route::get('/borrowings', [LibraryEmployeeController::class, 'borrowings']); // عرض جميع عمليات الإعارة الجارية والمعلقة
        Route::post('/borrowings/{borrowing}/return', [LibraryEmployeeController::class, 'registerReturn']); // تسجيل إرجاع النسخة الورقية المستعارة للمكتبة

        // إدارة النسخ الفيزيائية (الرفوف)
        Route::get('/books/{book}/copies', [LibraryEmployeeController::class, 'copies']); // عرض كل النسخ الورقية المتاحة للكتاب ورقم الرف
        Route::post('/books/{book}/copies', [LibraryEmployeeController::class, 'addCopy']); // إضافة نسخة فيزيائية جديدة للمكتبة
        Route::put('/copies/{copy}', [LibraryEmployeeController::class, 'updateCopy']); // تعديل حالة نسخة فيزيائية (متاحة، تالفة، مفقودة)

        // إدارة الغرامات المالية
        Route::get('/fines', [LibraryEmployeeController::class, 'fines']);            // عرض قائمة الغرامات المستحقة على القراء
        Route::post('/fines/{borrowing}/mark-paid', [LibraryEmployeeController::class, 'markFinePaid']); // تسديد الغرامة وإغلاق ذمة القارئ

        // إدارة المقاعد والقاعات
        Route::get('/seats', [SeatController::class, 'index']);                       // عرض قائمة المقاعد المعرفة بالنظام
        Route::post('/seats', [SeatController::class, 'store']);                      // إضافة مقعد جديد للنظام
        Route::delete('/seats/{seat}', [SeatController::class, 'destroy']);           // حذف مقعد من النظام
        Route::get('/reservations', [LibraryEmployeeController::class, 'reservations']); // متابعة كافة الحجوزات اليومية للمقاعد

        // إدارة الأقسام والتصنيفات
        Route::post('/categories', [CategoryController::class, 'store']);              // إضافة قسم/تصنيف كتب جديد
        Route::put('/categories/{category}', [CategoryController::class, 'update']);  // تعديل اسم أو بيانات قسم موجود
        Route::post('/categories/{category}/toggle', [CategoryController::class, 'toggleActive']); // تفعيل أو إخفاء قسم من العرض

        // Walk-in Operations — خدمات الزوار المباشرين (بدون تطبيق)
        Route::prefix('walk-in')->group(function () {
            Route::post('/purchases', [WalkInController::class, 'createPurchase']);    // تسجيل بيع كتاب مباشر لزائر الشباك
            Route::post('/borrowings', [WalkInController::class, 'createBorrowing']);  // تسجيل إعارة مباشرة لزائر الشباك
            Route::post('/reservations', [WalkInController::class, 'createReservation']);// تسجيل حجز مقعد مباشر لزائر
            Route::get('/stats', [WalkInController::class, 'stats']);                 // عرض إحصائيات المبيعات والإعارات المباشرة
        });

        // إدخال الكتب اليدوية
        Route::post('/manual-books', [LibraryEmployeeController::class, 'createManualBook']); // إدخال كتاب قديم أو يدوي بدون ربطه بحساب مؤلف
    });

// Author & Content Employee — موظف مراجعة المحتوى والمؤلفين
Route::middleware(['auth:sanctum', 'role:author_content_employee'])
    ->prefix('employee/content')
    ->group(function () {

        // مراجعة طلبات الانضمام كمؤلفين
        Route::get('/author-requests', [AuthorContentEmployeeController::class, 'authorRequests']); // عرض طلبت ترقية الحسابات لمؤلفين
        Route::post('/author-requests/{authorRequest}/pre-approve', [AuthorContentEmployeeController::class, 'preApprove']); // موافقة مبدئية وتحويل الطلب للمدير
        Route::post('/author-requests/{authorRequest}/reject', [AuthorContentEmployeeController::class, 'reject']); // رفض طلب الانضمام كمؤلف
        Route::post('/author-requests/{authorRequest}/request-changes', [AuthorContentEmployeeController::class, 'requestChanges']); // طلب تعديلات على طلب الانضمام

        // مراجعة الكتب المقدمة للنشر والتعديل
        Route::get('/books/pending', [AuthorContentEmployeeController::class, 'pendingBooks']); // عرض الكتب تنتظر التدقيق والموافقة
        Route::post('/books/{book}/start-review', [AuthorContentEmployeeController::class, 'startReview']); // قفل الكتاب وقيد المراجعة لمنع تعارض الموظفين
        Route::post('/books/{book}/approve', [AuthorContentEmployeeController::class, 'approveBook']); // الموافقة على نشر الكتاب رسمياً
        Route::post('/books/{book}/reject', [AuthorContentEmployeeController::class, 'rejectBook']);   // رفض نشر الكتاب مع ذكر السبب
        Route::post('/books/{book}/request-changes', [AuthorContentEmployeeController::class, 'requestBookChanges']); // طلب تعديلات في المحتوى من المؤلف

        Route::get('/modification-requests', [AuthorContentEmployeeController::class, 'modificationRequests']); // عرض طلبات التعديل على كتب منشورة
        Route::post('/modification-requests/{authorRequest}/approve', [AuthorContentEmployeeController::class, 'approveModification']); // قبول التعديلات على الكتاب
        Route::post('/modification-requests/{authorRequest}/reject', [AuthorContentEmployeeController::class, 'rejectModification']); // رفض التعديلات المطلوبة
    });

// Admin — لوحة التحكم العامة لمدير النظام
Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function () {

        // إدارة حسابات المستخدمين
        Route::get('/users', [AdminUserController::class, 'index']);                   // عرض كافة المستخدمين المسجلين بالنظام
        Route::get('/users/{user}', [AdminUserController::class, 'show']);             // عرض التفاصيل الكاملة لحساب مستخدم محدد
        Route::post('/users/{user}/disable', [AdminUserController::class, 'disable']); // حظر أو تجميد حساب مستخدم
        Route::post('/users/{user}/enable', [AdminUserController::class, 'enable']);   // إلغاء الحظر وإعادة تفعيل حساب مستخدم
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);       // حذف حساب المستخدم نهائياً

        // إدارة الموظفين وصلاحياتهم
        Route::get('/employees', [AdminEmployeeController::class, 'index']);           // عرض قائمة الموظفين للنظام
        Route::post('/employees', [AdminEmployeeController::class, 'store']);          // إضافة موظف جديد وتحديد نوعه (مكتبة / محتوى)
        Route::put('/employees/{user}', [AdminEmployeeController::class, 'update']);   // تعديل بيانات وصلاحيات موظف
        Route::delete('/employees/{user}', [AdminEmployeeController::class, 'destroy']);// حذف حساب موظف

        // الموافقات النهائية على طلبات المؤلفين
        Route::get('/author-requests/pre-approved', [AdminAuthorController::class, 'preApprovedRequests']); // عرض الطلبات المعمدة مبدئياً من موظف المحتوى
        Route::post('/author-requests/{authorRequest}/approve', [AdminAuthorController::class, 'approve']); // اعتماد طلب المؤلف نهائياً وترقية حسابه
        Route::post('/author-requests/{authorRequest}/reject', [AdminAuthorController::class, 'reject']);   // رفض الطلب نهائياً
        Route::get('/authors', [AdminAuthorController::class, 'index']); // عرض قائمة جميع المؤلفين

        // إعدادات النسبة المالية للأرباح
        Route::get('/settings/author-revenue-percent', [AdminSettingsController::class, 'getAuthorRevenuePercent']); // استعلام عن نسبة أرباح المؤلفين من المبيعات
        Route::put('/settings/author-revenue-percent', [AdminSettingsController::class, 'setAuthorRevenuePercent']); // تعديل نسبة أرباح المؤلفين

        // إدارة حسابات المؤلفين
        Route::post('/authors/{user}/disable', [AdminAuthorController::class, 'disableAuthor']); // حظر حساب مؤلف ومعطل نشر كتبه
        Route::post('/authors/{user}/enable', [AdminAuthorController::class, 'enableAuthor']);   // إزالة الحظر عن حساب المؤلف

        // إدارة رؤية الكتب
        Route::post('/books/{book}/hide', [AdminBookController::class, 'hide']);       // إخفاء كتاب من القائمة العامة للجمهور
        Route::post('/books/{book}/unhide', [AdminBookController::class, 'unhide']);   // إظهار الكتاب وتفعيله للجمهور

        // الرقابة والإشراف
        Route::delete('/reviews/{review}', [AdminBookController::class, 'deleteReview']); // حذف تقييم أو مراجعة مخالفة للشروط

        // إدارة العروض والتخفيضات
        Route::get('/offers', [OfferController::class, 'adminIndex']);                // عرض كافة العروض المتاحة والمغلقة
        Route::post('/offers', [OfferController::class, 'store']);                    // إنشاء عرض تخفيض جديد
        Route::put('/offers/{offer}', [OfferController::class, 'update']);            // تعديل شروط أو تاريخ عرض موجود
        Route::delete('/offers/{offer}', [OfferController::class, 'destroy']);        // حذف عرض تخفيض
        Route::get('/books/low-activity', [AdminDashboardController::class, 'lowActivityBooks']); // جلب قائمة الكتب الخاملة قليلة المبيعات والإعارات

        // التقارير والإحصائيات الشاملة
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);          // عرض ملخص لوحة التحليلات العامة
        Route::get('/stats/sales', [AdminDashboardController::class, 'salesStats']);    // تقارير وإحصائيات المبيعات
        Route::get('/stats/borrowings', [AdminDashboardController::class, 'borrowingStats']); // تقارير وإحصائيات الإعارات
        Route::get('/stats/reservations', [AdminDashboardController::class, 'reservationStats']); // تقارير حجوزات المقاعد
        Route::get('/stats/revenue', [AdminDashboardController::class, 'revenueStats']); // تقارير الإيرادات والدخل المالي
        Route::get('/stats/fines', [AdminDashboardController::class, 'fineStats']);     // تقارير تحصيل الغرامات
        Route::get('/stats/authors-earnings', [AdminDashboardController::class, 'authorEarningsStats']); // إحصائيات المستحقات المالية للمؤلفين
        Route::get('/stats/walk-in-vs-registered', [AdminDashboardController::class, 'walkInVsRegisteredStats']); // مقارنة بين المبيعات المباشرة ومبيعات التطبيق

        // إعدادات النظام العامة
        Route::get('/settings', [AdminSettingsController::class, 'index']);           // عرض شجرة كافة إعدادات النظام
        Route::put('/settings/{key}', [AdminSettingsController::class, 'update']);     // تعديل قيمة إعداد محدد بالنظام
    });
