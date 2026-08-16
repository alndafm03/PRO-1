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
        Schema::create('borrowings', function (Blueprint $table) {
            $table->id();

            /**
             * صاحب الإعارة
             * - يمكن أن يكون null في حالة Walk-in الورقية فقط
             * - الإعارة الرقمية تتطلب user_id دائماً
             */
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->boolean('is_walk_in')->default(false);
            /** الكتاب */
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();
            $table->enum('book_type', ['physical', 'digital']);
            $table->foreignId('physical_copy_id')->nullable()->constrained('physical_copies')->nullOnDelete();

            /** خيار الإعارة */
            $table->foreignId('borrow_option_id')->constrained('borrow_options')->restrictOnDelete();

            /**Snapshot من خيار الإعارة  */
            $table->unsignedSmallInteger('duration_days');
            $table->decimal('price', 8, 2);

            /** تواريخ الإعارة */
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            /**
             * حالة الإعارة
             * "overdue" لا تُخزّن أبداً — تُحسب عند القراءة فقط
             */
            $table->enum('status', [
                'pending',   // بانتظار الدفع والتحقق
                'active',    // الإعارة فعّالة
                'rejected',  // رفض الإعارة
                'returned',  // تم الإرجاع
                'expired'    // رقمية منتهية
            ])->default('pending');

            /**تاريخ الإرجاع الفعلي*/
            $table->timestamp('returned_at')->nullable();

            /**التجديد
             * يسمح بتجديد واحد فقط */
            $table->boolean('renewed')->default(false);

            /* الغرامات
             * fine = 5% × price × days_late
            */
            $table->decimal('fine_amount', 8, 2)->nullable();
            $table->unsignedInteger('fine_days_late')->nullable();
            $table->boolean('fine_paid')->default(false);

            /**
             * حصة المؤلف (BR-16)
             * snapshot حتى لو تغيّرت النسبة لاحقاً
             */
            $table->decimal('author_revenue_percent_snapshot', 5, 2)->nullable();
            $table->decimal('author_share_amount', 8, 2)->nullable();

            $table->timestamps();

            /**
             * مسار البحث عن الإعارات المتأخرة
             */
            $table->index(['status', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrowings');
    }
};
