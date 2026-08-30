<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'book_id' => $this->book_id,
            'book' => $this->whenLoaded('book', fn () => new BookResource($this->book)),
            'type' => $this->type,
            'price_at_purchase' => $this->price_at_purchase,
            'status' => $this->status,
            'ready_at' => $this->ready_at,
            'completed_at' => $this->completed_at,
        ];
    }
}
