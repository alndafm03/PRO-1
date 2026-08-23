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
use App\Http\Controllers\Api\StripeWebhookController;
Route::prefix('books')->group(function () {
    Route::get('/', [BookController::class, 'index']);
    Route::get('/{book}', [BookController::class, 'show']);
    Route::get('/{book}/reviews', [BookFeedbackController::class, 'index']);
    Route::get('/{book}/availability', [BookController::class, 'availability']);
});
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}/books', [CategoryController::class, 'books']);
Route::get('/authors/{user}', [BookController::class, 'authorProfile']);
Route::get('/offers', [OfferController::class, 'index']);
Route::get('/search', [SearchController::class, 'search']);
Route::get('/filter/books', [SearchController::class, 'filterBooks']);
Route::get('/library/info', [AdminSettingsController::class, 'publicInfo']);
// Public Stripe webhook: called by Stripe's servers, never by a logged-in
// user, so it must stay outside auth:sanctum. It is also excluded from CSRF
// verification in bootstrap/app.php (see VerifyCsrfToken exceptions).
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle']);
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::post('/avatar', [ProfileController::class, 'updateAvatar']);
        Route::put('/password', [ProfileController::class, 'updatePassword']);
        Route::delete('/', [ProfileController::class, 'destroy']);
    });
    Route::prefix('favorites')->group(function () {
        Route::get('/', [FavoriteController::class, 'index']);
        Route::post('/{book}', [FavoriteController::class, 'store']);
        Route::delete('/{book}', [FavoriteController::class, 'destroy']);
    });
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/items', [CartController::class, 'addItem']);
        Route::put('/items/{item}', [CartController::class, 'updateItem']);
        Route::delete('/items/{item}', [CartController::class, 'removeItem']);
        Route::post('/checkout', [OrderController::class, 'checkout']);
    });
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::get('/{order}', [OrderController::class, 'show']);
        Route::post('/{order}/checkout-session', [PaymentController::class, 'createCheckoutSession']);
        Route::get('/{order}/payment-status', [PaymentController::class, 'status']);
        Route::post('/order-items/{orderItem}/receive', [OrderController::class, 'markCompleted']);
    });
    Route::get('/purchases/digital/{book}/read', [BookController::class, 'readDigital']);
    Route::get('/purchases', [OrderController::class, 'myPurchases']);
    Route::prefix('borrowings')->group(function () {
        Route::get('/', [BorrowingController::class, 'index']);
        Route::get('/{borrowing}', [BorrowingController::class, 'show']);
        Route::post('/physical', [BorrowingController::class, 'requestPhysical']);
        Route::post('/digital', [BorrowingController::class, 'requestDigital']);
        Route::post('/{borrowing}/checkout-session', [PaymentController::class, 'createCheckoutSession']);
        Route::get('/{borrowing}/payment-status', [PaymentController::class, 'status']);
        Route::post('/{borrowing}/renew', [BorrowingController::class, 'renew']);
        Route::get('/{borrowing}/read', [BorrowingController::class, 'readDigital']);
        Route::get('/book/{book}/options', [BorrowingController::class, 'options']);
    });
    Route::get('/fines', [FineController::class, 'myFines']);
    Route::get('/seats/availability', [SeatController::class, 'availability']);
    Route::prefix('reservations')->group(function () {
        Route::get('/', [ReservationController::class, 'myReservations']);
        Route::post('/', [ReservationController::class, 'store']);
        Route::post('/{reservation}/checkout-session', [PaymentController::class, 'createCheckoutSession']);
        Route::get('/{reservation}/payment-status', [PaymentController::class, 'status']);
    });
    Route::prefix('books/{book}')->group(function () {
        Route::post('/rating', [BookFeedbackController::class, 'rate']);
        Route::put('/rating', [BookFeedbackController::class, 'updateRating']);
        Route::post('/review', [BookFeedbackController::class, 'review']);
        Route::put('/review', [BookFeedbackController::class, 'updateReview']);
        Route::delete('/review', [BookFeedbackController::class, 'deleteReview']);
    });
    Route::get('/recommendations', [RecommendationController::class, 'forUser']);
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']);
    });
    Route::prefix('author-requests')->group(function () {
        Route::get('/', [AuthorRequestController::class, 'myRequests']);
        Route::post('/', [AuthorRequestController::class, 'apply']);
        Route::get('/{authorRequest}', [AuthorRequestController::class, 'show']);
        Route::delete('/{authorRequest}', [AuthorRequestController::class, 'cancel']);
    });
    Route::middleware('role:author')->prefix('author')->group(function () {
        Route::prefix('books')->group(function () {
            Route::get('/', [AuthorBookController::class, 'index']);
            Route::post('/', [AuthorBookController::class, 'store']);
            Route::get('/{book}', [AuthorBookController::class, 'show']);
            Route::put('/{book}', [AuthorBookController::class, 'updateDraft']);
            Route::post('/{book}/submit', [AuthorBookController::class, 'submit']);
            Route::post('/{book}/modification-requests', [AuthorBookController::class, 'requestModification']);
        });
        Route::get('/earnings', [AuthorEarningController::class, 'index']);
        Route::get('/earnings/{book}', [AuthorEarningController::class, 'forBook']);
    });
});
Route::middleware(['auth:sanctum', 'role:library_employee'])
    ->prefix('employee/library')
    ->group(function () {
        Route::get('/payments/pending', [LibraryEmployeeController::class, 'pendingPayments']);
        Route::post('/payments/{payment}/approve', [LibraryEmployeeController::class, 'approvePayment']);
        Route::post('/payments/{payment}/reject', [LibraryEmployeeController::class, 'rejectPayment']);
        Route::post('/order-items/{orderItem}/mark-ready', [LibraryEmployeeController::class, 'markOrderItemReady']);
        Route::get('/borrowings', [LibraryEmployeeController::class, 'borrowings']);
        Route::post('/borrowings/{borrowing}/return', [LibraryEmployeeController::class, 'registerReturn']);
        Route::get('/books/{book}/copies', [LibraryEmployeeController::class, 'copies']);
        Route::post('/books/{book}/copies', [LibraryEmployeeController::class, 'addCopy']);
        Route::put('/copies/{copy}', [LibraryEmployeeController::class, 'updateCopy']);
        Route::get('/fines', [LibraryEmployeeController::class, 'fines']);
        Route::post('/fines/{borrowing}/mark-paid', [LibraryEmployeeController::class, 'markFinePaid']);
        Route::get('/seats', [SeatController::class, 'index']);
        Route::post('/seats', [SeatController::class, 'store']);
        Route::delete('/seats/{seat}', [SeatController::class, 'destroy']);
        Route::get('/reservations', [LibraryEmployeeController::class, 'reservations']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::post('/categories/{category}/toggle', [CategoryController::class, 'toggleActive']);
        Route::prefix('walk-in')->group(function () {
            Route::post('/purchases', [WalkInController::class, 'createPurchase']);
            Route::post('/borrowings', [WalkInController::class, 'createBorrowing']);
            Route::post('/reservations', [WalkInController::class, 'createReservation']);
            Route::get('/stats', [WalkInController::class, 'stats']);
        });
        Route::post('/manual-books', [LibraryEmployeeController::class, 'createManualBook']);
    });
Route::middleware(['auth:sanctum', 'role:author_content_employee'])
    ->prefix('employee/content')
    ->group(function () {
        Route::get('/author-requests', [AuthorContentEmployeeController::class, 'authorRequests']);
        Route::post('/author-requests/{authorRequest}/pre-approve', [AuthorContentEmployeeController::class, 'preApprove']);
        Route::post('/author-requests/{authorRequest}/reject', [AuthorContentEmployeeController::class, 'reject']);
        Route::post('/author-requests/{authorRequest}/request-changes', [AuthorContentEmployeeController::class, 'requestChanges']);
        Route::get('/books/pending', [AuthorContentEmployeeController::class, 'pendingBooks']);
        Route::post('/books/{book}/start-review', [AuthorContentEmployeeController::class, 'startReview']);
        Route::post('/books/{book}/approve', [AuthorContentEmployeeController::class, 'approveBook']);
        Route::post('/books/{book}/reject', [AuthorContentEmployeeController::class, 'rejectBook']);
        Route::post('/books/{book}/request-changes', [AuthorContentEmployeeController::class, 'requestBookChanges']);
        Route::get('/modification-requests', [AuthorContentEmployeeController::class, 'modificationRequests']);
        Route::post('/modification-requests/{authorRequest}/approve', [AuthorContentEmployeeController::class, 'approveModification']);
        Route::post('/modification-requests/{authorRequest}/reject', [AuthorContentEmployeeController::class, 'rejectModification']);
    });
Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{user}', [AdminUserController::class, 'show']);
        Route::post('/users/{user}/disable', [AdminUserController::class, 'disable']);
        Route::post('/users/{user}/enable', [AdminUserController::class, 'enable']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
        Route::get('/employees', [AdminEmployeeController::class, 'index']);
        Route::post('/employees', [AdminEmployeeController::class, 'store']);
        Route::put('/employees/{user}', [AdminEmployeeController::class, 'update']);
        Route::delete('/employees/{user}', [AdminEmployeeController::class, 'destroy']);
        Route::get('/author-requests/pre-approved', [AdminAuthorController::class, 'preApprovedRequests']);
        Route::post('/author-requests/{authorRequest}/approve', [AdminAuthorController::class, 'approve']);
        Route::post('/author-requests/{authorRequest}/reject', [AdminAuthorController::class, 'reject']);
        Route::get('/authors', [AdminAuthorController::class, 'index']);
        Route::get('/settings/author-revenue-percent', [AdminSettingsController::class, 'getAuthorRevenuePercent']);
        Route::put('/settings/author-revenue-percent', [AdminSettingsController::class, 'setAuthorRevenuePercent']);
        Route::post('/authors/{user}/disable', [AdminAuthorController::class, 'disableAuthor']);
        Route::post('/authors/{user}/enable', [AdminAuthorController::class, 'enableAuthor']);
        Route::post('/books/{book}/hide', [AdminBookController::class, 'hide']);
        Route::post('/books/{book}/unhide', [AdminBookController::class, 'unhide']);
        Route::delete('/reviews/{review}', [AdminBookController::class, 'deleteReview']);
        Route::get('/offers', [OfferController::class, 'adminIndex']);
        Route::post('/offers', [OfferController::class, 'store']);
        Route::put('/offers/{offer}', [OfferController::class, 'update']);
        Route::delete('/offers/{offer}', [OfferController::class, 'destroy']);
        Route::get('/books/low-activity', [AdminDashboardController::class, 'lowActivityBooks']);
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/stats/sales', [AdminDashboardController::class, 'salesStats']);
        Route::get('/stats/borrowings', [AdminDashboardController::class, 'borrowingStats']);
        Route::get('/stats/reservations', [AdminDashboardController::class, 'reservationStats']);
        Route::get('/stats/revenue', [AdminDashboardController::class, 'revenueStats']);
        Route::get('/stats/fines', [AdminDashboardController::class, 'fineStats']);
        Route::get('/stats/authors-earnings', [AdminDashboardController::class, 'authorEarningsStats']);
        Route::get('/stats/walk-in-vs-registered', [AdminDashboardController::class, 'walkInVsRegisteredStats']);
        Route::get('/settings', [AdminSettingsController::class, 'index']);
        Route::put('/settings/{key}', [AdminSettingsController::class, 'update']);
    });

