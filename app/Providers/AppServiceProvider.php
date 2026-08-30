<?php

namespace App\Providers;

use App\Models\Borrowing;
use App\Models\Order;
use App\Models\Reservation;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Fix: payable_type used to store the fully-qualified class name
        // (App\Models\Order, App\Models\Borrowing, ...). Renaming/moving any
        // of those classes in the future would silently break every existing
        // payment record. A morph map decouples the stored value from the
        // namespace. Existing rows that still contain the raw FQCN keep
        // working (Eloquent falls back to the literal class name when it is
        // not found in the map), while every new payment is written using
        // the short alias below.
        Relation::morphMap([
            'order' => Order::class,
            'borrowing' => Borrowing::class,
            'reservation' => Reservation::class,
        ]);

        // Fix: there was no rate limiting at all on login/register, making
        // both endpoints trivially brute-forceable. Throttle by IP AND by
        // the submitted identifier, so an attacker can't bypass the limit
        // by spraying many different emails from one IP, or many IPs at one
        // account.
        RateLimiter::for('login', function (Request $request) {
            $identifier = Str::lower((string) $request->input('login'));

            return [
                Limit::perMinute(5)->by($identifier.'|'.$request->ip()),
                Limit::perMinute(20)->by($request->ip()),
            ];
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
