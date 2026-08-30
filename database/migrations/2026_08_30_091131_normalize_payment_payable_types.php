<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const MAP = [
        'App\\Models\\Order' => 'order',
        'App\\Models\\Borrowing' => 'borrowing',
        'App\\Models\\Reservation' => 'reservation',
    ];

    public function up(): void
    {
        foreach (self::MAP as $fqcn => $alias) {
            DB::table('payments')
                ->where('payable_type', $fqcn)
                ->update(['payable_type' => $alias]);
        }
    }

    public function down(): void
    {
        foreach (self::MAP as $fqcn => $alias) {
            DB::table('payments')
                ->where('payable_type', $alias)
                ->update(['payable_type' => $fqcn]);
        }
    }
};
