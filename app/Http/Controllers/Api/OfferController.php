<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Offer\StoreOfferRequest;
use App\Http\Requests\Offer\UpdateOfferRequest;
use App\Models\Offer;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    public function index()
    {
        $offers = Offer::active()->with('books')->get();

        return response()->json(['data' => $offers]);
    }

    public function adminIndex(Request $request)
    {
        $offers = Offer::with('books')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $offers]);
    }

    public function store(StoreOfferRequest $request)
    {
        $validated = $request->validated();

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

    public function update(UpdateOfferRequest $request, Offer $offer)
    {
        $validated = $request->validated();

        $offer->update(collect($validated)->except('book_ids')->toArray());

        if (isset($validated['book_ids'])) {
            $offer->books()->sync($validated['book_ids']);
        }

        return response()->json(['message' => 'تم تحديث العرض بنجاح', 'data' => $offer->load('books')]);
    }

    public function destroy(Offer $offer)
    {
        $offer->books()->detach();
        $offer->delete();

        return response()->json(['message' => 'تم حذف العرض بنجاح']);
    }
}
