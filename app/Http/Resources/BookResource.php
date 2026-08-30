<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BookResource extends JsonResource
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
            // Never expose the raw storage path / a direct URL to the digital
            // file here. Access is only granted through the dedicated,
            // authorized "read digital" endpoints which stream the file.
            'has_digital_file' => (bool) $this->digital_file,
            'author' => new UserResource($this->whenLoaded('author')),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'borrow_options' => $this->whenLoaded('borrow_option'),
            'available_physical_copies' => $this->whenLoaded(
                'physicalCopies',
                fn () => $this->physicalCopies->count()
            ),
        ];
    }
}
