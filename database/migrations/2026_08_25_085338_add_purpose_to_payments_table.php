<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // 'primary' = دفع أصلي (شراء / إعارة / حجز) - 'fine' = دفع غرامة تأخير
            $table->string('purpose')->default('primary')->after('payable_id');
        });
    }
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('purpose');
        });
    }
};
