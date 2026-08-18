<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * FR-27 — the system-owned Walk-in Customer account, plus a trial Admin account.
     */
    public function run(): void
    {
        $walkIn = User::firstOrCreate(
            ['username' => 'walk_in_customer'],
            [
                'full_name' => 'Walk-in Customer',
                'phone' => '0000000000',
                'email' => 'walk-in@system.local',
                'password' => Hash::make(Str::random(40)),
                'status' => 'active',
                'birthday' => '2000-01-01',
                'is_system_account' => true,
            ]
        );
        $walkIn->roles()->syncWithoutDetaching(Role::firstOrCreate(['name' => 'reader'])->id);

        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'full_name' => 'System Admin',
                'phone' => '0100000000',
                'email' => 'admin@library.local',
                'password' => Hash::make('Admin@12345'),
                'status' => 'active',
                'birthday' => '1990-01-01',
                'is_system_account' => false,
            ]
        );
        $admin->roles()->syncWithoutDetaching(Role::firstOrCreate(['name' => 'admin'])->id);
    }
}
