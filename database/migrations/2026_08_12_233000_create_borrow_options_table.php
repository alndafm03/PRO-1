<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('borrow_options', function (Blueprint $table) {
            $table->id();

            // ربط الخيار بكتاب معين (FR-23)
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();

            // مدة الإعارة بالأيام (FR-11)
            $table->unsignedSmallInteger('duration_days'); // 7 / 14 / 30

            // الأسعار حسب النوع (BR-04/BR-05)
            $table->decimal('physical_price', 8, 2)->nullable();
            $table->decimal('digital_price', 8, 2)->nullable();

            $table->timestamps();

            // منع تكرار نفس المدة لنفس الكتاب
            $table->unique(['book_id', 'duration_days']);
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrow_options');
    }
};
