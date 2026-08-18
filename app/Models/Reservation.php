<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Reservation extends Model
{
    protected $fillable = [
        'user_id',
        'created_by',
        'is_walk_in',
        'reservation_date',
        'period',
        'seats_count',
        'price',
        'status',
    ];
    protected function casts(): array
    {
        return [
            'is_walk_in' => 'boolean',
            'reservation_date' => 'date',
            'price' => 'decimal:2',
        ];
    }
    public function user():BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function payments():MorphMany
    {
        return $this->morphMany(Payment::class,'payable');
    }
    public function scopeForSlot($query,$date,string $period)
    {
        return $query->whereDate('reservation_date',$date)->where('period',$period);
    }
    public function scopeOccupying($query)
    {
        return $query->whereIn('status',['pending','confirmed']);
    }

}
