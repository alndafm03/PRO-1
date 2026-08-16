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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // صاحب الطلب (قد يكون null في حالة Walk-in)
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_walk_in')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            // حالة الطلب (FR-17)
            $table->enum('status', ['pending', 'confirmed', 'rejected'])->default('pending');


            $table->decimal('total_amount', 10, 2)->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
