<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * FR-14 — unique(user_id, book_id) يمنع التكرار على مستوى الـDB.
 */
class Favorite extends Model
{
    protected $fillable = ['user_id', 'book_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}
