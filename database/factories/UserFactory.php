<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     * FIX: كانت مبنية على schema Laravel الافتراضي (name/email_verified_at) وهاد غير موجود
     * بجدول users الفعلي (full_name/username/phone/birthday/status) — ما كانت تشتغل أصلاً.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'username' => fake()->unique()->userName(),
            'phone' => fake()->unique()->numerify('09########'),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'status' => 'active',
            'birthday' => fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
            'is_system_account' => false,
        ];
    }

    /**
     * Indicate that the account is disabled.
     */
    public function disabled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'disabled',
        ]);
    }
}
