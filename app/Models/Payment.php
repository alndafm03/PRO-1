<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'payable_type',
        'payable_id',
        'purpose',
        'amount',
        'currency',
        'gateway',
        'status',
        'stripe_checkout_session_id',
        'stripe_payment_intent_id',
        'paid_at',
        'failure_reason',
    ];
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
    public function scopePaid($query)
    {
        return $query->where('status', 'verified');
    }
    public function scopePrimary($query)
    {
        return $query->where('purpose', 'primary');
    }
    public function scopeFines($query)
    {
        return $query->where('purpose', 'fine');
    }
    public function markAsPaid(string $paymentIntentId, string $gateway = 'stripe'): void
    {
        $this->update([
            'status' => 'verified',
            'gateway' => $gateway,
            'stripe_payment_intent_id' => $paymentIntentId !== '' ? $paymentIntentId : $this->stripe_payment_intent_id,
            'paid_at' => now(),
        ]);
    }
    public function markAsFailed(?string $reason = null): void
    {
        $this->update([
            'status' => 'rejected',
            'failure_reason' => $reason,
        ]);
    }
}
