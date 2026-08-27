<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
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
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
    public function scopeOverdueCandidates($query)
    {
        return $query->where('status', 'active')->whereDate('end_date', '<', now());
    }
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
        return (int) now()->diffInDays($this->end_date, absolute: true);
    }
    public function canRenew(): bool
    {
        return $this->status === 'active'
            && ! $this->renewed
            && $this->end_date !== null
            && ! $this->end_date->isPast();
    }
    public function calculateFine(): float
    {
        $fine = round(0.05 * (float) $this->price * $this->daysLateAttribute(), 2);
        $bookPrice = $this->book_type === 'physical'
            ? (float) $this->book?->price_physical
            : (float) $this->book?->price_digital;
        return $bookPrice > 0 ? min($fine, $bookPrice) : $fine;
    }
    /**
     * يجمّد قيمة الغرامة على السجل بشكل نهائي (قابل للدفع) بدلاً من إبقائها
     * "تقديرية" تُحسب ديناميكيًا من overdueCandidates(). يجب استدعاؤها فقط
     * بينما لا تزال الإعارة "active" (قبل تغيير حالتها إلى returned/expired)
     * لأن calculateFine() يعتمد على isOverdueAttribute() التي تتحقق من الحالة.
     * آمنة للاستدعاء أكثر من مرة (لن تُعيد الحساب إذا كانت الغرامة مُجمَّدة مسبقًا).
     */
    public function finalizeFine(bool $isDamaged = false): void
    {
        if ($this->fine_amount !== null) {
            return;
        }
        $fine = $isDamaged ? 0.0 : $this->calculateFine();
        $this->update([
            'fine_amount' => $fine > 0 ? $fine : null,
            'fine_days_late' => $fine > 0 ? $this->daysLateAttribute() : null,
        ]);
    }
}
