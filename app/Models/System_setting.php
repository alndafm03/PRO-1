<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class System_setting extends Model
{
    protected $fillable = ['key', 'value', 'updated_by'];
    protected $table='system_settings';
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class,'updated_by');
    }
    public static function getValue(string $key, mixed $default=null):mixed
    {
        return static::where('key',$key)->value('value')?? $default;
    }
    public static function setValue(string $key, string $value, ?int $updatedBy = null): self
{
    return static::updateOrCreate(
        ['key' => $key],
        ['value' => $value, 'updated_by' => $updatedBy]
    );
}

}
