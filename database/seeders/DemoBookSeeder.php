<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Borrow_option;
use App\Models\Category;
use App\Models\PhysicalCopy;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoBookSeeder extends Seeder
{
    public function run(): void
    {
        $author1 = User::where('username', 'author1')->first();
        $author2 = User::where('username', 'author2')->first();
        $contentEmployee = User::where('username', 'content_emp1')->first();

        $categories = Category::pluck('id', 'name');

        $this->makeBook([
            'title' => 'رواية الصحراء',
            'description' => 'رواية عن رحلة عبر الصحراء العربية.',
            'author_id' => $author1->id,
            'book_type' => 'both',
            'price_physical' => 8,
            'price_digital' => 4,
            'publish_status' => 'published',
            'published_at' => now()->subDays(60),
        ], [$categories['روايات']], saleCopies: 5, borrowCopies: 2, borrowOptions: [
            ['duration_days' => 7, 'physical_price' => 1, 'digital_price' => 0.5],
            ['duration_days' => 14, 'physical_price' => 1.5, 'digital_price' => 0.8],
        ]);

        $this->makeBook([
            'title' => 'أساسيات الفيزياء',
            'description' => 'مقدمة شاملة لمبادئ الفيزياء الحديثة.',
            'author_id' => $author2->id,
            'book_type' => 'physical',
            'price_physical' => 12,
            'publish_status' => 'published',
            'published_at' => now()->subDays(45),
        ], [$categories['علوم']], saleCopies: 3, borrowCopies: 2, borrowOptions: [
            ['duration_days' => 14, 'physical_price' => 2, 'digital_price' => null],
        ]);

        $this->makeBook([
            'title' => 'تاريخ الحضارات',
            'description' => 'استعراض لأهم الحضارات القديمة وتأثيرها.',
            'author_name' => 'د. سمير العلي، د. فادي حمدان',
            'book_type' => 'digital',
            'price_digital' => 6,
            'publish_status' => 'published',
            'published_at' => now()->subDays(90),
            'created_by' => $contentEmployee?->id,
        ], [$categories['تاريخ']]);

        $this->makeBook([
            'title' => 'عادات النجاح السبع',
            'description' => 'كيف تبني عادات تقودك للنجاح المهني والشخصي.',
            'author_id' => $author1->id,
            'book_type' => 'both',
            'price_physical' => 7,
            'price_digital' => 3.5,
            'publish_status' => 'published',
            'published_at' => now()->subDays(20),
        ], [$categories['تطوير الذات']], saleCopies: 4, borrowCopies: 1, borrowOptions: [
            ['duration_days' => 7, 'physical_price' => 1, 'digital_price' => 0.5],
        ]);

        $this->makeBook([
            'title' => 'تعلم بايثون من الصفر',
            'description' => 'دليل عملي لتعلم لغة بايثون للمبتدئين.',
            'author_id' => $author2->id,
            'book_type' => 'digital',
            'price_digital' => 5,
            'publish_status' => 'published',
            'published_at' => now()->subDays(10),
        ], [$categories['تكنولوجيا']]);

        $this->makeBook([
            'title' => 'حكايات ما قبل النوم',
            'description' => 'مجموعة قصص قصيرة للأطفال قبل النوم.',
            'author_name' => 'مكتبة المعرفة',
            'book_type' => 'physical',
            'price_physical' => 4,
            'publish_status' => 'published',
            'published_at' => now()->subDays(5),
            'created_by' => User::where('username', 'library_emp1')->first()?->id,
        ], [$categories['أدب أطفال']], saleCopies: 6, borrowCopies: 3, borrowOptions: [
            ['duration_days' => 7, 'physical_price' => 0.5, 'digital_price' => null],
        ]);

        // كتاب قيد الإرسال (Submitted) — لاختبار طابور مراجعة موظف المحتوى
        $this->makeBook([
            'title' => 'رواية تحت المراجعة',
            'description' => 'رواية مُقدَّمة حديثًا وبانتظار مراجعة موظف المحتوى.',
            'author_id' => $author1->id,
            'book_type' => 'digital',
            'price_digital' => 3,
            'publish_status' => 'submitted',
            'submitted_by' => $author1->id,
        ], [$categories['روايات']]);

        // كتاب قيد المراجعة فعليًا (Under Review) — مقفول من موظف المحتوى التجريبي
        $this->makeBook([
            'title' => 'كتاب قيد المراجعة الفعلية',
            'description' => 'كتاب دخل قيد المراجعة من موظف المحتوى.',
            'author_id' => $author2->id,
            'book_type' => 'physical',
            'price_physical' => 9,
            'publish_status' => 'under_review',
            'submitted_by' => $author2->id,
            'reviewed_by' => $contentEmployee?->id,
        ], [$categories['علوم']], saleCopies: 2);
    }

    private function makeBook(array $attributes, array $categoryIds, int $saleCopies = 0, int $borrowCopies = 0, array $borrowOptions = []): Book
    {
        $book = Book::firstOrCreate(
            ['title' => $attributes['title']],
            array_merge([
                'cover_image' => 'books/covers/placeholder.jpg',
                'digital_file' => in_array($attributes['book_type'], ['digital', 'both'], true) ? 'books/digital/placeholder.pdf' : null,
                'publisher' => 'دار المعرفة للنشر',
                'publisher_year' => 2023,
                'language' => 'ar',
                'page_count' => 200,
                'is_hidden' => false,
            ], $attributes)
        );

        if (! $book->wasRecentlyCreated) {
            return $book;
        }

        $book->categories()->sync($categoryIds);

        for ($i = 0; $i < $saleCopies; $i++) {
            PhysicalCopy::create(['book_id' => $book->id, 'copy_code' => "{$book->id}-S{$i}", 'purpose' => 'sale', 'status' => 'available']);
        }

        for ($i = 0; $i < $borrowCopies; $i++) {
            PhysicalCopy::create(['book_id' => $book->id, 'copy_code' => "{$book->id}-B{$i}", 'purpose' => 'borrowing', 'status' => 'available']);
        }

        foreach ($borrowOptions as $option) {
            Borrow_option::create(array_merge(['book_id' => $book->id], $option));
        }

        return $book;
    }
}
