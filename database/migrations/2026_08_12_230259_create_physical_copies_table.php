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
        Schema::create('physical_copies', function (Blueprint $table) {
            $table->id();

            $table->foreignId('book_id')
                ->constrained('books')
                ->onDelete('cascade');

            $table->string('copy_code')->nullable()->index();

            // FIX: عمود واحد بدل is_for_sale/is_for_borrow — BR-02 صريحة إن كل نسخة
            // لغرض واحد فقط، والـbooleanين المنفصلين كانوا يسمحوا بحالة غير صالحة
            // (الاثنين true أو الاثنين false) بدون ما الـDB تمنعها.
            $table->enum('purpose', ['sale', 'borrowing']);

            $table->enum('status', [
                'available',
                'borrowed',
                'sold'
            ])->default('available');

            $table->dateTime('status_changed_at')->nullable();

            $table->timestamps();
            
            $table->index(['book_id', 'purpose', 'status']); // مسار ساخن: فحص التوفر والتخصيص

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('physical_copies');
    }
};
