<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * BR-02: عمود purpose واحد (sale/borrowing) بدل booleanين منفصلين — كل نسخة لغرض واحد فقط.
 */
class PhysicalCopy extends Model
{
    protected $fillable = [
        'book_id',
        'copy_code',
        'purpose',
        'status',
        'status_changed_at',
    ];

    protected function casts(): array
    {
        return [
            'status_changed_at' => 'datetime',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class, 'physical_copy_id');
    }

    public function Order_items(): HasMany
    {
        return $this->hasMany(Order_items::class, 'physical_copy_id');
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeForSale($query)
    {
        return $query->where('purpose', 'sale');
    }

    public function scopeForBorrowing($query)
    {
        return $query->where('purpose', 'borrowing');
    }
}
