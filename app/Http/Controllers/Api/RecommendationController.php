<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\User_activity;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class RecommendationController extends Controller
{
    /**
     * نقاط التفاعل بحسب نوع النشاط (FR-54): فتح رقمي = 1، مفضلة = 2، إعارة = 3، شراء = 4.
     */
    private const ACTIVITY_POINTS = ['read' => 1, 'favorite' => 2, 'borrow' => 3, 'purchase' => 4];

    /**
     * FR-54: خوارزمية Hybrid Rule-Based بسيطة — بدون أي AI.
     * 1) أعلى الأقسام تفاعلًا مع المستخدم. 2) المؤلفون الأكثر تفاعلًا معهم. 3) كتب مشابهة
     * (نفس القسم — نفس آلية البند 1، فما في داعي لاستعلام منفصل). 4) Fallback: الكتب الأكثر شعبية
     * إذا نشاط المستخدم غير كافٍ.
     */
    public function forUser(Request $request)
    {
        $user = $request->user();
        $limit = min($request->integer('limit', 10), 50);

        $activities = User_activity::where('user_id', $user->id)->get();

        if ($activities->isEmpty()) {
            return response()->json([
                'data' => ['source' => 'popular', 'books' => $this->popularBooks($limit)],
            ]);
        }

        $interactedBookIds = $activities->pluck('book_id')->unique();
        $interactedBooks = Book::whereIn('id', $interactedBookIds)->with('categories:id')->get()->keyBy('id');

        [$topCategoryIds, $topAuthorIds] = $this->topCategoriesAndAuthors($activities, $interactedBooks);

        $recommended = collect();

        if ($topCategoryIds->isNotEmpty()) {
            $recommended = $recommended->merge(
                Book::query()->published()
                    ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $topCategoryIds))
                    ->whereNotIn('id', $interactedBookIds)
                    ->with('categories')
                    ->limit($limit)
                    ->get()
            );
        }

        if ($recommended->count() < $limit && $topAuthorIds->isNotEmpty()) {
            $excluded = $interactedBookIds->merge($recommended->pluck('id'));

            $recommended = $recommended->merge(
                Book::query()->published()
                    ->whereIn('author_id', $topAuthorIds)
                    ->whereNotIn('id', $excluded)
                    ->with('categories')
                    ->limit($limit - $recommended->count())
                    ->get()
            );
        }

        if ($recommended->count() < $limit) {
            $excluded = $interactedBookIds->merge($recommended->pluck('id'));
            $recommended = $recommended->merge($this->popularBooks($limit - $recommended->count(), $excluded));
        }

        $recommended = $recommended->unique('id')->take($limit)->values();

        return response()->json([
            'data' => ['source' => 'personalized', 'books' => $recommended],
        ]);
    }

    /**
     * @return array{0: Collection, 1: Collection} [أعلى الأقسام, أعلى المؤلفين] مرتبة تنازليًا حسب نقاط التفاعل.
     */
    private function topCategoriesAndAuthors(Collection $activities, Collection $interactedBooks): array
    {
        $categoryScores = [];
        $authorScores = [];

        foreach ($activities as $activity) {
            $points = self::ACTIVITY_POINTS[$activity->activity_type] ?? 1;
            $book = $interactedBooks->get($activity->book_id);

            if (! $book) {
                continue;
            }

            foreach ($book->categories as $category) {
                $categoryScores[$category->id] = ($categoryScores[$category->id] ?? 0) + $points;
            }

            if ($book->author_id !== null) {
                $authorScores[$book->author_id] = ($authorScores[$book->author_id] ?? 0) + $points;
            }
        }

        arsort($categoryScores);
        arsort($authorScores);

        return [
            collect(array_keys($categoryScores))->take(3),
            collect(array_keys($authorScores))->take(3),
        ];
    }

    /**
     * FR-54: Fallback — الكتب الأكثر شعبية (مبيعات + إعارات + تقييمات).
     */
    private function popularBooks(int $limit, ?Collection $excludeIds = null): Collection
    {
        return Book::query()->published()
            ->when($excludeIds, fn ($q) => $q->whereNotIn('id', $excludeIds))
            ->withCount(['Order_items as sales_count' => fn ($q) => $q->where('status', 'completed')])
            ->withCount(['borrowings as borrow_count' => fn ($q) => $q->whereIn('status', ['active', 'returned', 'expired'])])
            ->withAvg('book_feedback', 'rating')
            ->with('categories')
            ->orderByDesc('sales_count')
            ->orderByDesc('borrow_count')
            ->orderByDesc('book_feedback_avg_rating')
            ->limit($limit)
            ->get();
    }
}
