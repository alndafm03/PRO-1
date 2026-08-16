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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            // الطلب
            $table->foreignId('order_id')
                ->constrained('orders')
                ->onDelete('cascade');

            // الكتاب
            $table->foreignId('book_id')
                ->constrained('books')
                ->onDelete('cascade');

            // نوع النسخة: ورقية أو رقمية
            $table->enum('type', ['physical', 'digital']);

            // النسخة الورقية المخصصة للبيع (للنوع physical فقط)
            $table->foreignId('physical_copy_id')
                ->nullable()
                ->constrained('physical_copies')
                ->nullOnDelete();

            // السعر وقت الشراء
            $table->decimal('price_at_purchase', 10, 2);

            // نسبة المؤلف وقت الشراء

            // FIX: أصبحت nullable — كتاب يدوي بدون مؤلف نظام (author_id = null) ما إله نسبة
            // أرباح أصلًا؛ كانت هذه الأعمدة إلزامية بالملف الأصلي وهيك كل شراء لكتاب يدوي
            // كان رح يفشل (NOT NULL violation) إلا بحقن 0.00 قسرًا وخلط "لا يوجد مؤلف" مع
            // "نسبته صفر".
            $table->decimal('author_share_percent_at_purchase', 5, 2)->nullable();
            $table->decimal('author_share_amount_at_purchase', 10, 2)->nullable();

            // حالة العنصر حسب FR-17 (للورقي فقط)
            $table->enum('status', [
                'pending',    // بانتظار الدفع
                'confirmed',  // تم الدفع
                'ready',      // جاهز للاستلام
                'completed',  // تم الاستلام أو تم التفعيل
                'rejected'
            ])->default('pending');


            /**
             * تواريخ مهمة للورقي
             */
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
