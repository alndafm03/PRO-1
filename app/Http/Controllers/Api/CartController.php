<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Models\Book;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartController extends Controller
{
    public function __construct(private readonly CartService $cartService)
    {
    }

    /**
     * FR-16: عرض محتويات سلة الشراء المؤقتة.
     */
    public function index(Request $request)
    {
        return response()->json(['data' => $this->cartDetails($request)]);
    }

    /**
     * FR-16: إضافة كتاب (ورقي/رقمي) إلى السلة.
     */
    public function addItem(AddCartItemRequest $request)
    {
        $book = Book::query()->published()->findOrFail($request->validated('book_id'));
        $type = $request->validated('type');

        if (! in_array($book->book_type, [$type, 'both'], true)) {
            abort(422, 'هذا الكتاب لا يدعم هذا النوع من الشراء');
        }

        $quantity = $type === 'digital' ? 1 : $request->integer('quantity', 1);

        $cart = $this->cartService->get($request->user());
        $itemId = (string) Str::uuid();
        $cart[$itemId] = ['book_id' => $book->id, 'type' => $type, 'quantity' => $quantity];
        $this->cartService->put($request->user(), $cart);

        return response()->json(['message' => 'تمت الإضافة إلى السلة', 'data' => $this->cartDetails($request)], 201);
    }

    /**
     * FR-16: تعديل الكمية أو نوع النسخة لعنصر بالسلة.
     */
    public function updateItem(UpdateCartItemRequest $request, string $item)
    {
        $cart = $this->cartService->get($request->user());

        if (! isset($cart[$item])) {
            abort(404, 'العنصر غير موجود بالسلة');
        }

        if ($request->filled('type')) {
            $book = Book::query()->findOrFail($cart[$item]['book_id']);
            $type = $request->validated('type');

            if (! in_array($book->book_type, [$type, 'both'], true)) {
                abort(422, 'هذا الكتاب لا يدعم هذا النوع من الشراء');
            }

            $cart[$item]['type'] = $type;
        }

        if ($cart[$item]['type'] === 'digital') {
            $cart[$item]['quantity'] = 1;
        } elseif ($request->filled('quantity')) {
            $cart[$item]['quantity'] = $request->integer('quantity');
        }

        $this->cartService->put($request->user(), $cart);

        return response()->json(['data' => $this->cartDetails($request)]);
    }

    /**
     * FR-16: حذف عنصر محدد من السلة.
     */
    public function removeItem(Request $request, string $item)
    {
        $cart = $this->cartService->get($request->user());
        unset($cart[$item]);
        $this->cartService->put($request->user(), $cart);

        return response()->json(['message' => 'تمت إزالة العنصر من السلة', 'data' => $this->cartDetails($request)]);
    }

    private function cartDetails(Request $request): array
    {
        $cart = $this->cartService->get($request->user());
        $books = Book::query()
            ->whereIn('id', collect($cart)->pluck('book_id')->unique())
            ->get()
            ->keyBy('id');

        $items = collect($cart)->map(function (array $entry, string $itemId) use ($books) {
            $book = $books->get($entry['book_id']);
            $unitPrice = $book ? ($entry['type'] === 'physical' ? $book->price_physical : $book->price_digital) : null;

            return [
                'item_id' => $itemId,
                'book' => $book,
                'type' => $entry['type'],
                'quantity' => $entry['quantity'],
                'unit_price' => $unitPrice,
                'subtotal' => $unitPrice !== null ? round((float) $unitPrice * $entry['quantity'], 2) : null,
            ];
        })->values();

        return [
            'items' => $items,
            'total' => round((float) $items->sum('subtotal'), 2),
        ];
    }
}
