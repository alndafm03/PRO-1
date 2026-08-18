<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    /**
     * كلمة مرور موحّدة لكل حسابات الديمو لتسهيل التجربة على فريق الفرونت إند.
     */
    private const DEMO_PASSWORD = 'Password@123';

    public function run(): void
    {
        $readerRole = Role::firstOrCreate(['name' => 'reader']);
        $authorRole = Role::firstOrCreate(['name' => 'author']);
        $libraryEmployeeRole = Role::firstOrCreate(['name' => 'library_employee']);
        $contentEmployeeRole = Role::firstOrCreate(['name' => 'author_content_employee']);

        // FR-06: Author = Reader + Author Permissions — كل مؤلف يحمل الدورين معًا.
        $this->makeUser('reader1', 'قارئ تجريبي 1', 'reader1@library.local', [$readerRole]);
        $this->makeUser('reader2', 'قارئ تجريبي 2', 'reader2@library.local', [$readerRole]);
        $this->makeUser('reader3', 'قارئ تجريبي 3', 'reader3@library.local', [$readerRole]);

        $this->makeUser('author1', 'مؤلف تجريبي 1', 'author1@library.local', [$readerRole, $authorRole]);
        $this->makeUser('author2', 'مؤلف تجريبي 2', 'author2@library.local', [$readerRole, $authorRole]);

        $this->makeUser('library_emp1', 'موظف مكتبة تجريبي', 'libemp1@library.local', [$libraryEmployeeRole]);
        $this->makeUser('content_emp1', 'موظف محتوى تجريبي', 'contentemp1@library.local', [$contentEmployeeRole]);
    }

    private function makeUser(string $username, string $fullName, string $email, array $roles): User
    {
        $user = User::firstOrCreate(
            ['username' => $username],
            [
                'full_name' => $fullName,
                'phone' => '09' . substr((string) crc32($username), 0, 8),
                'email' => $email,
                'password' => Hash::make(self::DEMO_PASSWORD),
                'status' => 'active',
                'birthday' => '1995-01-01',
                'is_system_account' => false,
            ]
        );

        $user->roles()->syncWithoutDetaching(collect($roles)->pluck('id'));

        return $user;
    }
}
