<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * FR-65 يطلب صراحة أن يستطيع Library Employee تعديل حالة نسخة فيزيائية إلى
 * "متاحة، تالفة، مفقودة" — لكن عمود status الأصلي بجدول physical_copies يدعم
 * فقط available/borrowed/sold. لا يوجد غرامة على التالف/المفقود (مذكور صراحة
 * بقسم Out of Scope)، هاي فقط لتتبع حالة النسخة.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE physical_copies MODIFY status ENUM('available','borrowed','sold','damaged','lost') NOT NULL DEFAULT 'available'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE physical_copies MODIFY status ENUM('available','borrowed','sold') NOT NULL DEFAULT 'available'");
    }
};
