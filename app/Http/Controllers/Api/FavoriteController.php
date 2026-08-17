<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    /**
     * FR-14: عرض قائمة الكتب المضافة للمفضلة.
     */
    public function index(Request $request)
    {
        $favorites = $request->user()->favoriteBooks()
            ->with(['categories', 'author'])
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $favorites]);
    }

    /**
     * FR-14: إضافة كتاب محدد إلى المفضلة (لا يسمح بالتكرار).
     */
    public function store(Request $request, Book $book)
    {
        $request->user()->favorites()->firstOrCreate(['book_id' => $book->id]);

        return response()->json(['message' => 'تمت إضافة الكتاب إلى المفضلة'], 201);
    }

    /**
     * FR-14: إزالة كتاب محدد من المفضلة.
     */
    public function destroy(Request $request, Book $book)
    {
        $request->user()->favorites()->where('book_id', $book->id)->delete();

        return response()->json(['message' => 'تمت إزالة الكتاب من المفضلة']);
    }
}
