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
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();


            $table->boolean('is_walk_in')->default(false);

            $table->date('reservation_date');

            $table->enum('period', ['period_1', 'period_2']);

            $table->unsignedSmallInteger('seats_count');

            $table->decimal('price', 10, 2);
            $table->enum('status', [
                'pending',     // بانتظار الدفع
                'confirmed',   // تم التحقق من الدفع
                'rejected'     // رفض الموظف العملية
            ])->default('pending');

            $table->timestamps();

            $table->index(['reservation_date', 'period', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
