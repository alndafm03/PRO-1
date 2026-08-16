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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            // المستخدم الذي دفع (قد يكون null في حالة Walk-in)
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // علاقة polymorphic (FR-22)
            $table->nullableMorphs('payable');
            // payable_type + payable_id

            // مبلغ الدفع (snapshot)
            $table->decimal('amount', 10, 2);

            // حالة الدفع (FR-20)
            $table->enum('status', [
                'pending',   // بانتظار التحقق اليدوي
                'verified',  // تم التحقق
                'rejected'   // تم الرفض
            ])->default('pending');

            // timestamps
            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
