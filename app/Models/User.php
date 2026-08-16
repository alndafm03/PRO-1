<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;
    protected $fillable = [
        'full_name',
        'username',
        'phone',
        'email',
        'password',
        'status',
        'birthday',
        'avatar',
        'is_system_account',
        'last_login_at'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'birthday' => 'date',
            'last_login_at' => 'datetime',
            'is_system_account' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function hasRole(string $roleName): bool
    {
        return $this->roles()->where('name', $roleName)->exists();
    }
    public function isAuthor(): bool
    {
        return $this->hasRole('author');
    }
    public function isLibraryEmployee(): bool
    {
        return $this->hasRole('library_employee');
    }
    public function isAuthorContentEmployee(): bool
    {
        return $this->hasRole('author_content_employee');
    }
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    //كمؤلف
    public function authoredBooks(): HasMany
    {
        return $this->hasMany(Book::class, 'author_id');
    }
    public function submittedBook(): HasMany
    {
        return $this->hasMany(Book::class, 'submitted_by');
    }
    public function createdBooks(): HasMany
    {
        return $this->hasMany(Book::class, 'created_by');
    }
    public function reviewedBooks(): HasMany
    {
        return $this->hasMany(Book::class, 'reviewed_by');
    }
    public function authorRequests(): HasMany
    {
        return $this->hasMany(Author_request::class, 'user_id');
    }
    //قارئ
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoriteBooks(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'favorites');
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class, 'user_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'user_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'user_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'user_id');
    }

    public function bookFeedbacks(): HasMany
    {
        return $this->hasMany(Book_feedback::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(User_activity::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
    // موظف وادمن
    public function createdOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'created_by');
    }

    public function createdBorrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class, 'created_by');
    }

    public function createdReservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'created_by');
    }

    public function createdOffers(): HasMany
    {
        return $this->hasMany(Offer::class, 'created_by');
    }
}
