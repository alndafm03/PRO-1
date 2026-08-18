<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Borrowing;
use App\Models\Order_items;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class AuthorEarningController extends Controller
{
    /**
     * FR-48: إجمالي أرباح ونسب مبيعات المؤلف عبر كل كتبه (BR-16: النسب محفوظة كـsnapshot مع كل عملية).
     */
    public function index(Request $request)
    {
        $bookIds = $request->user()->authoredBooks()->pluck('id');

        return response()->json(['data' => $this->earningsFor($bookIds)]);
    }

    /**
     * FR-48: أرباح ومبيعات كتاب محدد للمؤلف.
     */
    public function forBook(Request $request, Book $book)
    {
        if ($book->author_id !== $request->user()->id) {
            abort(403, 'هذا الكتاب لا يخصك');
        }

        return response()->json([
            'data' => array_merge(
                ['book' => $book->only(['id', 'title'])],
                $this->earningsFor(collect([$book->id]))
            ),
        ]);
    }

    private function earningsFor(Collection $bookIds): array
    {
        $salesStats = Order_items::whereIn('book_id', $bookIds)
            ->where('status', 'completed')
            ->selectRaw('COUNT(*) as total_sales, COALESCE(SUM(price_at_purchase),0) as total_revenue, COALESCE(SUM(author_share_amount_at_purchase),0) as author_share')
            ->first();

        $borrowingStats = Borrowing::whereIn('book_id', $bookIds)
            ->whereIn('status', ['active', 'returned', 'expired'])
            ->selectRaw('COUNT(*) as total_borrowings, COALESCE(SUM(price),0) as total_revenue, COALESCE(SUM(author_share_amount),0) as author_share')
            ->first();

        return [
            'total_sales' => (int) $salesStats->total_sales,
            'total_borrowings' => (int) $borrowingStats->total_borrowings,
            'total_revenue' => round((float) $salesStats->total_revenue + (float) $borrowingStats->total_revenue, 2),
            'author_share' => round((float) $salesStats->author_share + (float) $borrowingStats->author_share, 2),
        ];
    }
}
