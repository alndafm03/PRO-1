<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Borrow_option extends Model
{
    protected $fillable = [
        'book_id',
        'duration_days',
        'physical_price',
        'digital_price',
    ];
    protected $table='borrow_options';
    protected function casts(): array
    {
        return [
            'physical_price' => 'decimal:2',
            'digital_price' => 'decimal:2',
        ];
    }
    public function book():BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
    public function borrowings():HasMany
    {
        return $this->hasMany(Borrowing::class);
    }
}
