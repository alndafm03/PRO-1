<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Search\FilterBooksRequest;
use App\Http\Requests\Search\SearchRequest;
use App\Models\Book;
use App\Models\Category;
use App\Models\User;

class SearchController extends Controller
{
    /**
     * FR-12: البحث في الكتب والمؤلفين والأقسام باسم الكتاب/المؤلف/غيرها من بيانات الفهرسة.
     */
    public function search(SearchRequest $request)
    {
        $q = $request->string('q')->toString();

        $books = Book::query()
            ->published()
            ->where(function ($query) use ($q) {
                $query->where('title', 'like', "%{$q}%")
                    ->orWhere('author_name', 'like', "%{$q}%");
            })
            ->with(['categories', 'author'])
            ->paginate($request->integer('per_page', 20));

        $authors = User::query()
            ->whereHas('roles', fn ($r) => $r->where('name', 'author'))
            ->where(function ($query) use ($q) {
                $query->where('full_name', 'like', "%{$q}%")
                    ->orWhere('username', 'like', "%{$q}%");
            })
            ->get(['id', 'full_name', 'username', 'avatar']);

        $categories = Category::query()
            ->active()
            ->where('name', 'like', "%{$q}%")
            ->get();

        return response()->json([
            'data' => [
                'books' => $books,
                'authors' => $authors,
                'categories' => $categories,
            ],
        ]);
    }

    /**
     * FR-13: تصفية الكتب حسب اللغة والنوع والتقييم (rating_avg محسوب ديناميكيًا عبر withAvg).
     */
    public function filterBooks(FilterBooksRequest $request)
    {
        $books = Book::query()
            ->published()
            ->when($request->filled('language'), fn ($q) => $q->where('language', $request->string('language')))
            ->when($request->filled('book_type'), fn ($q) => $q->where('book_type', $request->string('book_type')))
            ->withAvg('book_feedback', 'rating')
            ->when(
                $request->filled('min_rating'),
                fn ($q) => $q->having('book_feedback_avg_rating', '>=', (float) $request->input('min_rating'))
            )
            ->with(['categories', 'author'])
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $books]);
    }
}
