<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BorrowingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'book_id' => $this->book_id,
            'book' => $this->whenLoaded('book', fn () => new BookResource($this->book)),
            'book_type' => $this->book_type,
            'borrow_option' => $this->whenLoaded('borrow_option'),
            'duration_days' => $this->duration_days,
            'price' => $this->price,
            'status' => $this->status,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'returned_at' => $this->returned_at,
            'renewed' => $this->renewed,
            'fine_amount' => $this->fine_amount,
            'fine_paid' => $this->fine_paid,
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
