<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book_feedback extends Model
{
    protected $fillable = [
        'user_id',
        'book_id',
        'rating',
        'comment',
    ];
    protected $table = 'book_feedbacks';
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }
    public function user():BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function book():BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
    public function hasReview():bool
    {
        return ! empty($this->comment);
    }
    public function clearReview():void
    {
        $this->update(['comment'=>null]);
    }
}
