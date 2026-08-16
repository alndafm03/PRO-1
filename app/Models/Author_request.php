<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * FR-38 → FR-44
 * جدول موحّد لنوعين من الطلبات:
 * - upgrade: طلب ترقية Reader → Author (bio/description/previous_works/work_pdfs)
 *   workflow: pending → pre_approved (Author&Content Employee) → approved (Admin)
 *             أو rejected_by_employee / rejected_by_admin
 * - book_modification: طلب تعديل كتاب منشور (changes json فقط)
 *   workflow: pending → approved أو changes_requested / rejected_by_employee
 *             (لا يمر على الأدمن إطلاقاً)
 */
class Author_request extends Model
{
    protected $table = 'author_requests';
    protected $fillable = [
        'user_id',
        'request_type',
        'book_id',
        'bio',
        'description',
        'previous_works',
        'work_pdfs',
        'changes',
        'status',
        'reviewed_by',
        'reviewed_at',
        'decided_by',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'work_pdfs' => 'array',
            'changes' => 'array',
            'reviewed_at' => 'datetime',
            'decided_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function scopeUpgrade($query)
    {
        return $query->where('request_type', 'upgrade');
    }

    public function scopeBookModification($query)
    {
        return $query->where('request_type', 'book_modification');
    }

    public function isUpgrade(): bool
    {
        return $this->request_type === 'upgrade';
    }
}
