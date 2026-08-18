<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * FR-16: لا يوجد جدول Cart بالـDB — السلة تُخزّن مؤقتًا (Cache) لكل مستخدم، لا كجدول دائم.
 */
class CartService
{
    private function key(User $user): string
    {
        return 'cart:' . $user->id;
    }

    public function get(User $user): array
    {
        return Cache::get($this->key($user), []);
    }

    public function put(User $user, array $cart): void
    {
        Cache::put($this->key($user), $cart, now()->addDays(7));
    }

    public function clear(User $user): void
    {
        Cache::forget($this->key($user));
    }
}
