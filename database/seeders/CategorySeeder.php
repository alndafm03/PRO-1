<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = ['روايات', 'علوم', 'تاريخ', 'تطوير الذات', 'تكنولوجيا', 'أدب أطفال'];

        foreach ($categories as $index => $name) {
            Category::firstOrCreate(['name' => $name], ['is_active' => true, 'sort_order' => $index + 1]);
        }
    }
}
