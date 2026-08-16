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
        Schema::create('author_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->restrictOnDelete(); // مقدّم الطلب

            $table->enum('request_type', ['upgrade', 'book_modification']);
            $table->foreignId('book_id')->nullable()->constrained('books')->cascadeOnDelete(); // book_modification فقط

            // upgrade فقط (FR-38)
            $table->text('bio')->nullable();
            $table->text('description')->nullable();
            $table->text('previous_works')->nullable();
            $table->json('work_pdfs')->nullable(); // [{path, size}], حد أقصى 2 ملفات / 10MB لكل ملف — يُتحقق بالـFormRequest

            // book_modification فقط (FR-43)
            $table->json('changes')->nullable();

            $table->enum('status', [
                'pending',
                'changes_requested',
                'rejected_by_employee',
                'pre_approved',
                'rejected_by_admin',
                'approved',
            ])->default('pending'); // book_modification يستخدم فقط pending/changes_requested/rejected_by_employee/approved

            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete(); // Author & Content Employee
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete(); // Admin، upgrade فقط
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('author_requests');
    }
};
