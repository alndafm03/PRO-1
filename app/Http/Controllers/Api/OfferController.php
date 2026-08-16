<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    /**
     * FR-56: عرض العروض النشطة حاليًا للعموم (Guest).
     */
    public function index()
    {
        $offers = Offer::active()->with('books')->get();

        return response()->json(['data' => $offers]);
    }

    /**
     * عرض كافة العروض (نشطة ومنتهية) للأدمن.
     */
    public function adminIndex(Request $request)
    {
        $offers = Offer::with('books')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $offers]);
    }

    /**
     * FR-56: إنشاء عرض تخفيض جديد (Admin فقط، بلا أتمتة).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'discount_percent' => ['required', 'integer', 'min:1', 'max:100'],
            'starts_at'        => ['nullable', 'date'],
            'ends_at'          => ['nullable', 'date', 'after_or_equal:starts_at'],
            'active'           => ['sometimes', 'boolean'],
            'book_ids'         => ['required', 'array', 'min:1'],
            'book_ids.*'       => ['exists:books,id'],
        ]);

        $offer = Offer::create([
            'discount_percent' => $validated['discount_percent'],
            'starts_at'        => $validated['starts_at'] ?? null,
            'ends_at'          => $validated['ends_at'] ?? null,
            'active'           => $validated['active'] ?? true,
            'created_by'       => $request->user()->id,
        ]);

        $offer->books()->attach($validated['book_ids']);

        return response()->json([
            'message' => 'تم إنشاء العرض بنجاح',
            'data' => $offer->load('books'),
        ], 201);
    }

    /**
     * تعديل شروط أو تاريخ أو الكتب المرتبطة بعرض موجود.
     */
    public function update(Request $request, Offer $offer)
    {
        $validated = $request->validate([
            'discount_percent' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'starts_at'        => ['sometimes', 'nullable', 'date'],
            'ends_at'          => ['sometimes', 'nullable', 'date', 'after_or_equal:starts_at'],
            'active'           => ['sometimes', 'boolean'],
            'book_ids'         => ['sometimes', 'array', 'min:1'],
            'book_ids.*'       => ['exists:books,id'],
        ]);

        $offer->update(collect($validated)->except('book_ids')->toArray());

        if (isset($validated['book_ids'])) {
            $offer->books()->sync($validated['book_ids']);
        }

        return response()->json(['message' => 'تم تحديث العرض بنجاح', 'data' => $offer->load('books')]);
    }

    /**
     * حذف عرض تخفيض.
     */
    public function destroy(Offer $offer)
    {
        $offer->books()->detach();
        $offer->delete();

        return response()->json(['message' => 'تم حذف العرض بنجاح']);
    }
}
