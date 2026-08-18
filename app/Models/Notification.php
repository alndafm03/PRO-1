<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * FR-73
 * تنبيه: هذا موديل مخصص (custom) وليس Laravel الافتراضي (Illuminate\Notifications\DatabaseNotification)
 * لأن الجدول الفعلي فيه user_id مباشر (FK بسيط) وليس notifiable_type/notifiable_id polymorphic،
 * ولا يوجد UUID كـ primary key. النوع (type) نصي حر بقيم مقترحة:
 * operation_confirmation | borrowing_due_soon | borrowing_expired | request_update
 */
class Notification extends Model
{
    public const UPDATED_AT = null; // لا يوجد updated_at بالجدول

    protected $fillable = [
        'user_id',
        'type',
        'data',
        'push_sent',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'push_sent' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function markAsRead(): void
    {
        if ($this->read_at === null) {
            $this->update(['read_at' => now()]);
        }
    }

    /**
     * FR-73: إنشاء إشعار In-App. لا يوجد إرسال Push فعلي بالنطاق الحالي، push_sent تبقى false.
     */
    public static function notify(int $userId, string $type, array $data = []): self
    {
        return static::create([
            'user_id' => $userId,
            'type' => $type,
            'data' => $data,
        ]);
    }
}
