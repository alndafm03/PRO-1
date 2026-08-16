<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * FR-56, BR-19 — عروض يديرها Admin يدوياً (لا أتمتة)، غالباً على كتب قليلة النشاط.
 */
class Offer extends Model
{
    protected $fillable = [
        'discount_percent',
        'starts_at',
        'ends_at',
        'active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
            'active' => 'boolean',
            'discount_percent' => 'integer',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'offer_books');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhereDate('starts_at', '<=', now()))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhereDate('ends_at', '>=', now()));
    }
}
