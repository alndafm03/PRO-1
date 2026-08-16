<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User_activity extends Model
{
    protected $table = 'user_activities';
     public const UPDATED_AT = null;

     protected $fillable = [
        'user_id',
        'book_id',
        'activity_type',
    ];
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
    public function scopeOfType($query, string $type)
    {
        return $query->where('activity_type', $type);
    }
}
