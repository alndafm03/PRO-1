<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class AuthorBookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'cover_image' => $this->cover_image
                ? (str_starts_with($this->cover_image, 'http') ? $this->cover_image : Storage::disk('public')->url($this->cover_image))
                : null,
            'publisher' => $this->publisher,
            'publisher_year' => $this->publisher_year,
            'language' => $this->language,
            'book_type' => $this->book_type,
            'page_count' => $this->page_count,
            'price_physical' => $this->price_physical,
            'price_digital' => $this->price_digital,
            // The author can see that a digital file was uploaded, but the
            // API never hands back a downloadable path/URL for it.
            'has_digital_file' => (bool) $this->digital_file,
            'publish_status' => $this->publish_status,
            'is_hidden' => $this->is_hidden,
            'rejection_reason' => $this->rejection_reason,
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'borrow_options' => $this->whenLoaded('borrow_option'),
            'physical_copies_for_sale' => $this->whenLoaded(
                'physicalCopies',
                fn () => $this->physicalCopies->where('purpose', 'sale')->count()
            ),
            'physical_copies_for_borrowing' => $this->whenLoaded(
                'physicalCopies',
                fn () => $this->physicalCopies->where('purpose', 'borrowing')->count()
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
