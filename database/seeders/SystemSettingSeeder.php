<?php

namespace Database\Seeders;

use App\Models\System_setting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'library_name' => 'مكتبة المعرفة',
            'library_address' => 'دمشق، سوريا',
            'library_phone' => '011-2233445',
            'working_hours' => 'يوميًا من 9 صباحًا حتى 9 مساءً',
            'author_revenue_percent' => '30',
            'seat_reservation_price_per_seat' => '2',
            // FR-19: صورة QR ثابتة لحساب المكتبة على Sham Cash (placeholder — يُستبدل بصورة حقيقية من لوحة الأدمن).
            'payment_qr_code' => 'settings/sham_cash_qr_placeholder.png',
        ];

        foreach ($settings as $key => $value) {
            System_setting::firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
