<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * FR-09 → FR-49
 * author_id nullable: كتاب يدوي بدون مؤلف نظام يستخدم author_name نصي بدلاً منه (FR-45).
 * الإحصاءات (sales_count/borrow_count/rating_avg) مقصودة غير مخزّنة — تُحسب ديناميكيًا
 * (القسم 35)، لذلك هذا الموديل يوفّر accessors محسوبة بدل أعمدة DB.
 */
class Book extends Model
{
    protected $fillable = [
        'author_id',
        'title',
        'description',
        'cover_image',
        'author_name',
        'publisher',
        'publisher_year',
        'language',
        'book_type',
        'page_count',
        'publish_status',
        'is_hidden',
        'price_physical',
        'price_digital',
        'digital_file',
        'submitted_by',
        'created_by',
        'reviewed_by',
        'rejection_reason',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_hidden' => 'boolean',
            'price_physical' => 'decimal:2',
            'price_digital' => 'decimal:2',
            'published_at' => 'datetime',
            'publisher_year' => 'integer',
        ];
    }

    // ------------------------------------------------------------------
    // العلاقات
    // ------------------------------------------------------------------
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'book_categories');
    }

    public function physicalCopies(): HasMany
    {
        return $this->hasMany(PhysicalCopy::class);
    }

    public function borrow_option(): HasMany
    {
        return $this->hasMany(Borrow_option::class);
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class);
    }

    public function Order_items(): HasMany
    {
        return $this->hasMany(Order_items::class);
    }

    public function book_feedback(): HasMany
    {
        return $this->hasMany(Book_feedback::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoritedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(User_activity::class);
    }

    public function modificationRequests(): HasMany
    {
        // author_requests من نوع book_modification (FR-43)
        return $this->hasMany(Author_request::class, 'book_id')
            ->where('request_type', 'book_modification');
    }

    public function offers(): BelongsToMany
    {
        return $this->belongsToMany(Offer::class, 'offer_books');
    }

    // ------------------------------------------------------------------
    // Scopes
    // ------------------------------------------------------------------
    public function scopePublished($query)
    {
        return $query->where('publish_status', 'published')->where('is_hidden', false);
    }

    public function scopeForSale($query)
    {
        return $query->whereIn('book_type', ['physical', 'digital', 'both']);
    }

    // ------------------------------------------------------------------
    // Accessors محسوبة (بدل أعمدة مخزّنة — القسم 35)
    // ------------------------------------------------------------------
    public function ratingAvgAttribute(): float
    {
        return round((float) $this->book_feedback()->avg('rating'), 2);
    }

    public function ratingCountAttribute(): int
    {
        return $this->book_feedback()->count();
    }

    public function salesCountAttribute(): int
    {
        return $this->Order_items()->where('status', 'completed')->count();
    }

    public function borrowCountAttribute(): int
    {
        return $this->borrowings()->whereIn('status', ['active', 'returned', 'expired'])->count();
    }

    public function availablePhysicalCopiesCountAttribute(): int
    {
        return $this->physicalCopies()
            ->where('purpose', 'borrowing')
            ->where('status', 'available')
            ->count();
    }
}
