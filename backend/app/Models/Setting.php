<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'label',
        'value',
        'default_value',
        'group',
        'type',
        'options',
        'description',
        'is_system',
    ];

    protected $casts = [
        'options'    => 'array',
        'is_system'  => 'boolean',
    ];


    public static function get(string $key, mixed $fallback = null): mixed
    {
        $cacheKey = "setting:{$key}";

        $setting = Cache::remember($cacheKey, now()->addHours(6), function () use ($key) {
            return static::where('key', $key)->first();
        });

        if (! $setting) {
            return $fallback;
        }

        $raw = $setting->value ?? $setting->default_value;

        return static::cast($raw, $setting->type);
    }

    public static function set(string $key, mixed $value): void
    {
        static::where('key', $key)->update(['value' => $value]);
        Cache::forget("setting:{$key}");
    }

    /**
     * Get all settings for a group, keyed by setting key.
     */
    public static function getGroup(string $group): array
    {
        return static::where('group', $group)
            ->get()
            ->mapWithKeys(fn ($s) => [
                $s->key => static::cast($s->value ?? $s->default_value, $s->type),
            ])
            ->toArray();
    }

    /**
     * Cast raw string value to proper PHP type.
     */
    public static function cast(mixed $raw, string $type): mixed
    {
        if ($raw === null) {
            return null;
        }

        return match ($type) {
            'boolean' => filter_var($raw, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int)   $raw,
            'decimal' => (float) $raw,
            'json'    => is_array($raw) ? $raw : json_decode($raw, true),
            default   => (string) $raw,
        };
    }

    // Accessors

    /**
     * Return the typed value for API responses.
     */
    public function getTypedValueAttribute(): mixed
    {
        return static::cast($this->value ?? $this->default_value, $this->type);
    }
}
