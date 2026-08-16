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
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('title');
            $table->text('description');
            $table->string('cover_image');

            $table->string('author_name')->nullable(); //

            $table->string('publisher');
            $table->year('publisher_year')->nullable();
            $table->string('language');

            $table->enum('book_type', ['physical', 'digital', 'both'])->default('physical');
            $table->unsignedInteger('page_count')->nullable();

            $table->enum('publish_status', [
                'draft',
                'submitted',
                'under_review',
                'changes_required',
                'rejected',
                'published'
            ])->default('draft');

            $table->boolean('is_hidden')->default(false)->index();


            $table->decimal('price_physical', 10, 2)->nullable();
            $table->decimal('price_digital', 10, 2)->nullable();

            $table->string('digital_file')->nullable();


            // تتبع الجهة/المسار — ناقصة سابقًا
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete(); // Author
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(); // Library Employee, كتاب يدوي
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete(); // Author & Content Employee
            $table->text('rejection_reason')->nullable(); // FR-44: اختياري
            $table->timestamp('published_at')->nullable();

            // $table->integer('sales_count')->default(0);
            // $table->integer('borrow_count')->default(0);
            // $table->float('rating_avg')->default(0);
            // $table->integer('rating_count')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
