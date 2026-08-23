<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('gateway')->default('stripe')->after('status');
            $table->string('currency', 3)->default('usd')->after('amount');
            $table->string('stripe_checkout_session_id')->nullable()->unique()->after('gateway');
            $table->string('stripe_payment_intent_id')->nullable()->unique()->after('stripe_checkout_session_id');
            $table->timestamp('paid_at')->nullable()->after('stripe_payment_intent_id');
            $table->text('failure_reason')->nullable()->after('paid_at');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'gateway',
                'currency',
                'stripe_checkout_session_id',
                'stripe_payment_intent_id',
                'paid_at',
                'failure_reason',
            ]);
        });
    }
};
