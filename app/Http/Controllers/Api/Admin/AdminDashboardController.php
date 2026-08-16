<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Borrowing;
use App\Models\Category;
use App\Models\Order;
use App\Models\Order_items;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{

    public function index()
    {
        $salesRevenue = Order_items::where('status', 'completed')->sum('price_at_purchase');
        $borrowingRevenue = Borrowing::whereIn('status', ['active', 'returned', 'expired'])->sum('price');
        $reservationRevenue = Reservation::where('status', 'confirmed')->sum('price');
        $finesCollected = Borrowing::where('fine_paid', true)->sum('fine_amount');
        $finesOutstanding = Borrowing::where('fine_paid', false)->where('fine_amount', '>', 0)->sum('fine_amount');

        return response()->json([
            'data' => [
                'users_count'            => User::where('is_system_account', false)->count(),
                'authors_count'          => User::whereHas('roles', fn ($q) => $q->where('name', 'author'))->count(),
                'books_count'            => Book::count(),
                'published_books_count'  => Book::published()->count(),
                'sales_count'            => Order_items::where('status', 'completed')->count(),
                'borrowings_count'       => Borrowing::whereIn('status', ['active', 'returned', 'expired'])->count(),
                'reservations_count'     => Reservation::where('status', 'confirmed')->count(),
                'categories_count'       => Category::count(),
                'revenue' => [
                    'sales'        => $salesRevenue,
                    'borrowings'   => $borrowingRevenue,
                    'reservations' => $reservationRevenue,
                    'total'        => $salesRevenue + $borrowingRevenue + $reservationRevenue,
                ],
                'fines' => [
                    'collected'   => $finesCollected,
                    'outstanding' => $finesOutstanding,
                ],
            ],
        ]);
    }

    //حصائيات المبيعات
    public function salesStats(Request $request)
    {
        $stats = Order_items::query()
            ->selectRaw('DATE(completed_at) as date, type, COUNT(*) as items_count, SUM(price_at_purchase) as revenue')
            ->where('status', 'completed')
            ->when($request->filled('from'), fn ($q) => $q->whereDate('completed_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('completed_at', '<=', $request->date('to')))
            ->groupBy('date', 'type')
            ->orderByDesc('date')
            ->get();

        return response()->json(['data' => $stats]);
    }

    //احصائيات الاعارات
    public function borrowingStats()
    {
        $byStatus = Borrowing::query()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get();

        $overdueCount = Borrowing::overdueCandidates()->count();

        return response()->json([
            'data' => [
                'by_status' => $byStatus,
                'overdue_count' => $overdueCount,
            ],
        ]);
    }

    //احصائيات الحجوزات
    public function reservationStats()
    {
        $byStatus = Reservation::query()
            ->selectRaw('status, period, COUNT(*) as count, SUM(seats_count) as seats')
            ->groupBy('status', 'period')
            ->get();

        return response()->json(['data' => $byStatus]);
    }

    // تقارير الايرادات والدخل المالي
    public function revenueStats()
    {
        return $this->index();
    }

    // تقارير تحصيل الغرامات
    public function fineStats()
    {
        return response()->json([
            'data' => [
                'total_fines'        => Borrowing::where('fine_amount', '>', 0)->sum('fine_amount'),
                'paid_fines'         => Borrowing::where('fine_paid', true)->sum('fine_amount'),
                'unpaid_fines'       => Borrowing::where('fine_paid', false)->where('fine_amount', '>', 0)->sum('fine_amount'),
                'unpaid_fines_count' => Borrowing::where('fine_paid', false)->where('fine_amount', '>', 0)->count(),
            ],
        ]);
    }

    // احصائيات مستحقات المؤلفي
    public function authorEarningsStats()
    {
        $fromSales = Order_items::query()
            ->join('books', 'books.id', '=', 'order_items.book_id')
            ->where('order_items.status', 'completed')
            ->whereNotNull('order_items.author_share_amount_at_purchase')
            ->selectRaw('books.author_id, SUM(order_items.author_share_amount_at_purchase) as sales_earnings')
            ->groupBy('books.author_id')
            ->get();

        $fromBorrowings = Borrowing::query()
            ->join('books', 'books.id', '=', 'borrowings.book_id')
            ->whereIn('borrowings.status', ['active', 'returned', 'expired'])
            ->whereNotNull('borrowings.author_share_amount')
            ->selectRaw('books.author_id, SUM(borrowings.author_share_amount) as borrowing_earnings')
            ->groupBy('books.author_id')
            ->get();

        return response()->json([
            'data' => [
                'from_sales'      => $fromSales,
                'from_borrowings' => $fromBorrowings,
            ],
        ]);
    }

    // مقارنة عمليات Walk-in مقابل المستخدمين المسجلين
    public function walkInVsRegisteredStats()
    {
        return response()->json([
            'data' => [
                'sales' => [
                    'walk_in'    => Order::where('is_walk_in', true)->where('status', 'confirmed')->count(),
                    'registered' => Order::where('is_walk_in', false)->where('status', 'confirmed')->count(),
                ],
                'borrowings' => [
                    'walk_in'    => Borrowing::where('is_walk_in', true)->whereIn('status', ['active', 'returned', 'expired'])->count(),
                    'registered' => Borrowing::where('is_walk_in', false)->whereIn('status', ['active', 'returned', 'expired'])->count(),
                ],
                'reservations' => [
                    'walk_in'    => Reservation::where('is_walk_in', true)->where('status', 'confirmed')->count(),
                    'registered' => Reservation::where('is_walk_in', false)->where('status', 'confirmed')->count(),
                ],
            ],
        ]);
    }

    // الكتب ذات النشاط المنخفض
    public function lowActivityBooks(Request $request)
    {
        $since = now()->subDays(30);

        $activeBookIdsFromSales = Order_items::where('status', 'completed')
            ->where('completed_at', '>=', $since)
            ->pluck('book_id');

        $activeBookIdsFromBorrowings = Borrowing::whereIn('status', ['active', 'returned'])
            ->where('created_at', '>=', $since)
            ->pluck('book_id');

        $activeBookIds = $activeBookIdsFromSales->merge($activeBookIdsFromBorrowings)->unique();

        $lowActivityBooks = Book::published()
            ->whereNotIn('id', $activeBookIds)
            ->with('categories')
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $lowActivityBooks]);
    }
}
