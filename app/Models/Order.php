<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * FR-15 → FR-20
 * تنبيه: لا يوجد Cart كجدول DB — أول سجل دائم بهاد الـflow هو Order نفسه، الـCart
 * يُدار session-side فقط (راجع تعليق api.php).
 */
class Order extends Model
{
    protected $fillable = [
        'user_id',
        'is_walk_in',
        'created_by',
        'status',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'is_walk_in' => 'boolean',
            'total_amount' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Order_items::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    public function recalculateTotal(): void
    {
        $this->update([
            'total_amount' => $this->items()->sum('price_at_purchase'),
        ]);
    }
}
