<?php

namespace App\Policies;

use App\Models\Order_items;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class Order_itemsPolicy
{
    public function view(User $user, Order_items $orderItem): Response
    {
        return $user->id === $orderItem->order->user_id
            ? Response::allow()
            : Response::deny('هذا العنصر لا يخصك');
    }
}
