<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Borrow_option;
use App\Models\PhysicalCopy;
class BookProvisioningService
{
    public function syncPhysicalCopies(Book $book, int $saleCount, int $borrowCount): void
    {
        foreach (['sale' => $saleCount, 'borrowing' => $borrowCount] as $purpose => $targetCount) {
            $existing = $book->physicalCopies()->where('purpose', $purpose)->get();
            $currentCount = $existing->count();

            if ($targetCount > $currentCount) {
                for ($i = 0; $i < $targetCount - $currentCount; $i++) {
                    PhysicalCopy::create(['book_id' => $book->id, 'purpose' => $purpose, 'status' => 'available']);
                }
            } elseif ($targetCount < $currentCount) {
                $removable = $existing->where('status', 'available')->take($currentCount - $targetCount);
                PhysicalCopy::whereIn('id', $removable->pluck('id'))->delete();
            }
        }
    }

    public function syncBorrowOptions(Book $book, ?array $options): void
    {
        if ($options === null) {
            return;
        }

        $book->borrow_option()->delete();

        foreach ($options as $option) {
            Borrow_option::create([
                'book_id' => $book->id,
                'duration_days' => $option['duration_days'],
                'physical_price' => $option['physical_price'] ?? null,
                'digital_price' => $option['digital_price'] ?? null,
            ]);
        }
    }
}
