<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * FR-04 — the five roles the system supports.
     */
    public function run(): void
    {
        foreach (['reader', 'author', 'library_employee', 'author_content_employee', 'admin'] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }
}
