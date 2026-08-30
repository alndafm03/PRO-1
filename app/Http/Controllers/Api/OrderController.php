<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderItemResource;
use App\Http\Resources\OrderResource;
use App\Models\Book;
use App\Models\Order;
use App\Models\Order_items;
use App\Models\PhysicalCopy;
use App\Models\System_setting;
use App\Models\User_activity;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = $request->user()->orders()
            ->with('items.book')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => OrderResource::collection($orders)]);
    }

    public function show(Request $request, Order $order)
    {
        $this->authorize('view', $order);

        return response()->json([
            'data' => new OrderResource($order->load('items.book', 'payments')),
        ]);
    }

    public function checkout(Request $request, CartService $cartService)
    {
        $user = $request->user();
        $cart = $cartService->get($user);

        if (empty($cart)) {
            abort(422, 'السلة فارغة');
        }

        $authorRevenuePercent = (float) System_setting::getValue('author_revenue_percent', 0);

        $order = DB::transaction(function () use ($cart, $user, $authorRevenuePercent) {
            $order = Order::create([
                'user_id' => $user->id,
                'is_walk_in' => false,
                'status' => 'pending',
            ]);

            foreach ($cart as $entry) {
                $book = Book::query()->published()->lockForUpdate()->findOrFail($entry['book_id']);
                $type = $entry['type'];
                $quantity = $type === 'digital' ? 1 : $entry['quantity'];

                for ($i = 0; $i < $quantity; $i++) {
                    $physicalCopyId = null;

                    if ($type === 'physical') {
                        $copy = PhysicalCopy::query()
                            ->forSale()->available()
                            ->where('book_id', $book->id)
                            ->lockForUpdate()
                            ->first();

                        if (! $copy) {
                            abort(422, "لا توجد نسخة ورقية متاحة للبيع للكتاب: {$book->title}");
                        }

                        $copy->update(['status' => 'sold', 'status_changed_at' => now()]);
                        $physicalCopyId = $copy->id;
                    }

                    $price = $type === 'physical' ? $book->price_physical : $book->price_digital;
                    $authorSharePercent = $book->author_id !== null ? $authorRevenuePercent : null;
                    $authorShareAmount = $authorSharePercent !== null
                        ? round((float) $price * $authorSharePercent / 100, 2)
                        : null;

                    Order_items::create([
                        'order_id' => $order->id,
                        'book_id' => $book->id,
                        'type' => $type,
                        'physical_copy_id' => $physicalCopyId,
                        'price_at_purchase' => $price,
                        'author_share_percent_at_purchase' => $authorSharePercent,
                        'author_share_amount_at_purchase' => $authorShareAmount,
                        'status' => 'pending',
                    ]);
                }
            }

            $order->recalculateTotal();
            $order->payments()->create([
                'user_id' => $user->id,
                'amount' => $order->total_amount,
                'status' => 'pending',
            ]);

            return $order;
        });

        $cartService->clear($user);

        foreach (collect($cart)->pluck('book_id')->unique() as $bookId) {
            User_activity::log($user->id, $bookId, 'purchase');
        }

        return response()->json([
            'message' => 'تم إنشاء الطلب بنجاح، بانتظار الدفع',
            'data' => new OrderResource($order->load('items.book', 'payments')),
        ], 201);
    }

    public function markCompleted(Request $request, Order_items $orderItem)
    {
        $this->authorize('view', $orderItem);

        if ($orderItem->type !== 'physical' || $orderItem->status !== 'ready') {
            abort(422, 'هذا العنصر غير جاهز للاستلام');
        }

        $orderItem->update(['status' => 'completed', 'completed_at' => now()]);

        return response()->json([
            'message' => 'تم تأكيد الاستلام بنجاح',
            'data' => new OrderItemResource($orderItem),
        ]);
    }

    public function myPurchases(Request $request)
    {
        $purchases = Order_items::query()
            ->whereHas('order', fn ($q) => $q->where('user_id', $request->user()->id))
            ->where('type', 'digital')
            ->whereIn('status', ['confirmed', 'completed'])
            ->with('book')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => OrderItemResource::collection($purchases)]);
    }
}
