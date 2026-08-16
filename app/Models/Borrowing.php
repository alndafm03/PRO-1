<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * FR-21 → FR-36, BR-04 → BR-07, BR-16, BR-17
 * حالة "overdue" غير مخزّنة بالـDB أبداً — تُحسب ديناميكياً عبر isOverdue()/الـaccessor،
 * تماماً متل ما موثّق بتعليق الـmigration الأصلي.
 */
class Borrowing extends Model
{
    protected $fillable = [
        'user_id',
        'created_by',
        'is_walk_in',
        'book_id',
        'book_type',
        'physical_copy_id',
        'borrow_option_id',
        'duration_days',
        'price',
        'start_date',
        'end_date',
        'status',
        'returned_at',
        'renewed',
        'fine_amount',
        'fine_days_late',
        'fine_paid',
        'author_revenue_percent_snapshot',
        'author_share_amount',
    ];

    protected function casts(): array
    {
        return [
            'is_walk_in' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
            'returned_at' => 'datetime',
            'renewed' => 'boolean',
            'fine_paid' => 'boolean',
            'price' => 'decimal:2',
            'fine_amount' => 'decimal:2',
            'author_revenue_percent_snapshot' => 'decimal:2',
            'author_share_amount' => 'decimal:2',
        ];
    }

    // ------------------------------------------------------------------
    // العلاقات
    // ------------------------------------------------------------------
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function physicalCopy(): BelongsTo
    {
        return $this->belongsTo(PhysicalCopy::class);
    }

    public function borrow_option(): BelongsTo
    {
        return $this->belongsTo(Borrow_option::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    // ------------------------------------------------------------------
    // Scopes
    // ------------------------------------------------------------------
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOverdueCandidates($query)
    {
        // مسار البحث المفهرس (status, end_date) بالـmigration
        return $query->where('status', 'active')->whereDate('end_date', '<', now());
    }

    // ------------------------------------------------------------------
    // منطق محسوب (BR-06, BR-07, BR-17) — غير مخزّن
    // ------------------------------------------------------------------
    public function isOverdueAttribute(): bool
    {
        return $this->status === 'active'
            && $this->end_date !== null
            && $this->end_date->isPast();
    }

    public function daysLateAttribute(): int
    {
        if (! $this->isOverdueAttribute() || $this->end_date === null) {
            return 0;
        }

        return now()->diffInDays($this->end_date);
    }

    public function canRenew(): bool
    {
        // BR-06: تجديد مرة واحدة فقط، وقبل الانتهاء
        return $this->status === 'active'
            && ! $this->renewed
            && $this->end_date !== null
            && ! $this->end_date->isPast();
    }

    public function calculateFine(): float
    {
        // BR-07: fine = 5% × price × days_late
        return round(0.05 * (float) $this->price * $this->daysLateAttribute(), 2);
    }
}
