<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order_items extends Model
{
    protected $table = 'order_items';
    protected $fillable = [
        'order_id',
        'book_id',
        'type',
        'physical_copy_id',
        'price_at_purchase',
        'author_share_percent_at_purchase',
        'author_share_amount_at_purchase',
        'status',
        'ready_at',
        'completed_at',
    ];
    protected function casts(): array
    {
        return [
            'price_at_purchase' => 'decimal:2',
            'author_share_percent_at_purchase' => 'decimal:2',
            'author_share_amount_at_purchase' => 'decimal:2',
            'ready_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
    public function order():BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
    public function physicalCopy(): BelongsTo
    {
        return $this->belongsTo(PhysicalCopy::class);
    }
    public function isDigitalAccessGranted(): bool
    {
        // BR-11: وصول دائم للمشترى الرقمي بمجرد اكتمال الدفع/التأكيد
        return $this->type === 'digital' && in_array($this->status, ['confirmed', 'completed'], true);
    }
}
