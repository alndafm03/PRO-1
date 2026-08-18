<?php

namespace Database\Seeders;

use App\Models\Author_request;
use App\Models\Book;
use App\Models\Book_feedback;
use App\Models\Borrow_option;
use App\Models\Borrowing;
use App\Models\Favorite;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Order_items;
use App\Models\PhysicalCopy;
use App\Models\Reservation;
use App\Models\System_setting;
use App\Models\User;
use App\Models\User_activity;
use Illuminate\Database\Seeder;

class DemoTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $reader1 = User::where('username', 'reader1')->first();
        $reader2 = User::where('username', 'reader2')->first();
        $reader3 = User::where('username', 'reader3')->first();
        $admin = User::where('username', 'admin')->first();
        $contentEmployee = User::where('username', 'content_emp1')->first();

        $novel = Book::where('title', 'رواية الصحراء')->first();
        $physics = Book::where('title', 'أساسيات الفيزياء')->first();
        $python = Book::where('title', 'تعلم بايثون من الصفر')->first();

        if (! $reader1 || ! $novel || ! $physics || ! $python) {
            return; // يعتمد على DemoUserSeeder وDemoBookSeeder — يُتجاوز لو ما اشتغلوا قبله
        }

        $authorRevenuePercent = (float) System_setting::getValue('author_revenue_percent', 0);

        // === طلب شراء مكتمل (reader1 اشترى نسخة ورقية من "رواية الصحراء") ===
        if (! Order::where('user_id', $reader1->id)->where('is_walk_in', false)->exists()) {
            $order = Order::create(['user_id' => $reader1->id, 'is_walk_in' => false, 'status' => 'confirmed']);
            $copy = PhysicalCopy::where('book_id', $novel->id)->forSale()->available()->first();

            if ($copy) {
                $copy->update(['status' => 'sold', 'status_changed_at' => now()]);
                $authorShare = $novel->author_id ? round((float) $novel->price_physical * $authorRevenuePercent / 100, 2) : null;

                Order_items::create([
                    'order_id' => $order->id, 'book_id' => $novel->id, 'type' => 'physical', 'physical_copy_id' => $copy->id,
                    'price_at_purchase' => $novel->price_physical,
                    'author_share_percent_at_purchase' => $novel->author_id ? $authorRevenuePercent : null,
                    'author_share_amount_at_purchase' => $authorShare,
                    'status' => 'completed', 'ready_at' => now()->subDay(), 'completed_at' => now(),
                ]);
                $order->recalculateTotal();
                $order->payments()->create(['user_id' => $reader1->id, 'amount' => $order->total_amount, 'status' => 'verified']);
            }
        }
        $this->logActivityOnce($reader1->id, $novel->id, 'purchase');

        // === طلب شراء بانتظار تحقق الموظف (reader2 يشتري "تعلم بايثون من الصفر" رقمي) ===
        if (! Order::where('user_id', $reader2->id)->where('status', 'pending')->exists()) {
            $order2 = Order::create(['user_id' => $reader2->id, 'is_walk_in' => false, 'status' => 'pending']);
            Order_items::create([
                'order_id' => $order2->id, 'book_id' => $python->id, 'type' => 'digital',
                'price_at_purchase' => $python->price_digital, 'status' => 'pending',
            ]);
            $order2->recalculateTotal();
            $order2->payments()->create(['user_id' => $reader2->id, 'amount' => $order2->total_amount, 'status' => 'pending']);
        }

        // === إعارة فعّالة (reader1 يستعير "أساسيات الفيزياء" ورقيًا، 14 يوم) ===
        if (! Borrowing::where('user_id', $reader1->id)->where('status', 'active')->exists()) {
            $option = Borrow_option::where('book_id', $physics->id)->first();
            $copy = PhysicalCopy::where('book_id', $physics->id)->forBorrowing()->available()->first();

            if ($option && $copy) {
                $copy->update(['status' => 'borrowed', 'status_changed_at' => now()]);
                $authorShare = $physics->author_id ? round((float) $option->physical_price * $authorRevenuePercent / 100, 2) : null;

                $borrowing = Borrowing::create([
                    'user_id' => $reader1->id, 'created_by' => $reader1->id, 'is_walk_in' => false,
                    'book_id' => $physics->id, 'book_type' => 'physical', 'physical_copy_id' => $copy->id,
                    'borrow_option_id' => $option->id, 'duration_days' => $option->duration_days, 'price' => $option->physical_price,
                    'status' => 'active', 'start_date' => now()->subDays(3), 'end_date' => now()->addDays($option->duration_days - 3),
                    'author_revenue_percent_snapshot' => $physics->author_id ? $authorRevenuePercent : null,
                    'author_share_amount' => $authorShare,
                ]);
                $borrowing->payments()->create(['user_id' => $reader1->id, 'amount' => $option->physical_price, 'status' => 'verified']);
            }
        }
        $this->logActivityOnce($reader1->id, $physics->id, 'borrow');

        // === طلب إعارة بانتظار الموافقة (reader3 يطلب استعارة "رواية الصحراء" 7 أيام) ===
        if (! Borrowing::where('user_id', $reader3->id)->where('status', 'pending')->exists()) {
            $option = Borrow_option::where('book_id', $novel->id)->where('duration_days', 7)->first();
            $copy = PhysicalCopy::where('book_id', $novel->id)->forBorrowing()->available()->first();

            if ($option && $copy) {
                $copy->update(['status' => 'borrowed', 'status_changed_at' => now()]);

                $borrowing = Borrowing::create([
                    'user_id' => $reader3->id, 'created_by' => $reader3->id, 'is_walk_in' => false,
                    'book_id' => $novel->id, 'book_type' => 'physical', 'physical_copy_id' => $copy->id,
                    'borrow_option_id' => $option->id, 'duration_days' => $option->duration_days, 'price' => $option->physical_price,
                    'status' => 'pending',
                ]);
                $borrowing->payments()->create(['user_id' => $reader3->id, 'amount' => $option->physical_price, 'status' => 'pending']);
            }
        }

        // === حجز مقاعد مؤكد (reader2، اليوم، الفترة 1، مقعدين) ===
        if (! Reservation::where('user_id', $reader2->id)->where('status', 'confirmed')->exists()) {
            $pricePerSeat = (float) System_setting::getValue('seat_reservation_price_per_seat', 0);
            $reservation = Reservation::create([
                'user_id' => $reader2->id, 'created_by' => $reader2->id, 'is_walk_in' => false,
                'reservation_date' => now()->toDateString(), 'period' => 'period_1', 'seats_count' => 2,
                'price' => round($pricePerSeat * 2, 2), 'status' => 'confirmed',
            ]);
            $reservation->payments()->create(['user_id' => $reader2->id, 'amount' => $reservation->price, 'status' => 'verified']);
        }

        // === حجز مقاعد بانتظار الدفع (reader3، غدًا، الفترة 2، مقعد واحد) ===
        if (! Reservation::where('user_id', $reader3->id)->where('status', 'pending')->exists()) {
            $pricePerSeat = (float) System_setting::getValue('seat_reservation_price_per_seat', 0);
            $reservation2 = Reservation::create([
                'user_id' => $reader3->id, 'created_by' => $reader3->id, 'is_walk_in' => false,
                'reservation_date' => now()->addDay()->toDateString(), 'period' => 'period_2', 'seats_count' => 1,
                'price' => round($pricePerSeat * 1, 2), 'status' => 'pending',
            ]);
            $reservation2->payments()->create(['user_id' => $reader3->id, 'amount' => $reservation2->price, 'status' => 'pending']);
        }

        // === تقييمات ومراجعات (BR-13: فقط لمن اشترى/استعار فعليًا — reader1 مؤهل للكتابين أعلاه) ===
        Book_feedback::firstOrCreate(
            ['user_id' => $reader1->id, 'book_id' => $novel->id],
            ['rating' => 5, 'comment' => 'رواية رائعة، أنصح بقراءتها بشدة.']
        );
        Book_feedback::firstOrCreate(
            ['user_id' => $reader1->id, 'book_id' => $physics->id],
            ['rating' => 4, 'comment' => 'شرح واضح ومبسّط للمفاهيم الأساسية.']
        );

        // === مفضلة (FR-14) ===
        Favorite::firstOrCreate(['user_id' => $reader2->id, 'book_id' => $python->id]);
        $this->logActivityOnce($reader2->id, $python->id, 'favorite');

        // === طلبات ترقية لمؤلف (FR-38/39) ===
        if ($reader2 && ! Author_request::where('user_id', $reader2->id)->where('request_type', 'upgrade')->exists()) {
            Author_request::create([
                'user_id' => $reader2->id, 'request_type' => 'upgrade', 'status' => 'pending',
                'bio' => 'كاتب مهتم بأدب الرحلات.', 'description' => 'أرغب بنشر تجاربي في الكتابة.',
                'previous_works' => 'مقالات منشورة على مدونة شخصية.', 'work_pdfs' => [],
            ]);
        }

        if ($reader3 && ! Author_request::where('user_id', $reader3->id)->where('request_type', 'upgrade')->exists()) {
            Author_request::create([
                'user_id' => $reader3->id, 'request_type' => 'upgrade', 'status' => 'pre_approved',
                'bio' => 'باحث ومحاضر جامعي.', 'description' => 'أرغب بنشر مؤلفاتي الأكاديمية.',
                'previous_works' => 'عدة أبحاث منشورة.', 'work_pdfs' => [],
                'reviewed_by' => $contentEmployee?->id, 'reviewed_at' => now()->subDay(),
            ]);
        }

        // === عرض تخفيض نشط (FR-56) ===
        if ($admin && ! Offer::where('discount_percent', 20)->exists()) {
            $offer = Offer::create([
                'discount_percent' => 20, 'starts_at' => null, 'ends_at' => now()->addDays(30),
                'active' => true, 'created_by' => $admin->id,
            ]);
            $offer->books()->syncWithoutDetaching([$python->id]);
        }
    }

    /**
     * FR-53: مستقل عن حراس "الشرط الموجود مسبقًا" أعلاه — بيتأكد النشاط مسجّل دايمًا حتى لو
     * إعادة تشغيل الـseeder صادفت العمليات (Order/Borrowing) موجودة مسبقًا من تشغيل سابق.
     */
    private function logActivityOnce(int $userId, int $bookId, string $type): void
    {
        $exists = User_activity::where('user_id', $userId)
            ->where('book_id', $bookId)
            ->where('activity_type', $type)
            ->exists();

        if (! $exists) {
            User_activity::log($userId, $bookId, $type);
        }
    }
}
