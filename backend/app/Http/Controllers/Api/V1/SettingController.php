<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;


class SettingController extends ApiController
{

    public function index(): JsonResponse
    {
        $settings = Setting::orderBy('group')->orderBy('key')->get();

        $grouped = $settings->groupBy('group')->map(function ($items) {
            return $items->map(fn ($s) => $this->formatSetting($s));
        });

        return $this->success($grouped, 'Settings loaded');
    }


    public function byGroup(string $group): JsonResponse
    {
        $allowedGroups = ['general', 'health', 'commission', 'documents', 'bandwidth', 'notifications'];

        if (! in_array($group, $allowedGroups)) {
            return $this->error("Unknown settings group: [{$group}]", 404);
        }

        $settings = Setting::where('group', $group)
            ->orderBy('key')
            ->get()
            ->map(fn ($s) => $this->formatSetting($s));

        return $this->success($settings, "Settings for group [{$group}]");
    }


    public function update(Request $request, string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->first();

        if (! $setting) {
            return $this->error("Setting [{$key}] not found.", 404);
        }

        // Validate the incoming value based on the setting's type
        $rules  = $this->validationRules($setting);
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->error('Validation failed', 422, $validator->errors());
        }

        $newValue = $this->prepareValue($request->input('value'), $setting->type);

        $setting->update(['value' => $newValue]);

        // Flush cache for this key
        Cache::forget("setting:{$key}");

        return $this->success(
            $this->formatSetting($setting->fresh()),
            "Setting [{$key}] updated successfully."
        );
    }


    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'settings'         => 'required|array|min:1',
            'settings.*.key'   => 'required|string|exists:settings,key',
            'settings.*.value' => 'required',
        ]);

        $updated = [];
        $errors  = [];

        foreach ($request->input('settings') as $item) {
            $setting = Setting::where('key', $item['key'])->first();

            if (! $setting) {
                $errors[] = "Key [{$item['key']}] not found.";
                continue;
            }

            $rules = $this->validationRules($setting, $item['value']);
            $validator = Validator::make(['value' => $item['value']], $rules);

            if ($validator->fails()) {
                $errors[] = "Key [{$item['key']}]: " . $validator->errors()->first('value');
                continue;
            }

            $newValue = $this->prepareValue($item['value'], $setting->type);
            $setting->update(['value' => $newValue]);
            Cache::forget("setting:{$setting->key}");
            $updated[] = $item['key'];
        }

        if (! empty($errors) && empty($updated)) {
            return $this->error('Bulk update failed', 422, $errors);
        }

        return $this->success([
            'updated' => $updated,
            'errors'  => $errors,
        ], count($updated) . ' setting(s) updated successfully.');
    }


    public function reset(string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->first();

        if (! $setting) {
            return $this->error("Setting [{$key}] not found.", 404);
        }

        $setting->update(['value' => $setting->default_value]);
        Cache::forget("setting:{$key}");

        return $this->success(
            $this->formatSetting($setting->fresh()),
            "Setting [{$key}] reset to default."
        );
    }

    // Private Helpers

    /**
     * Format a setting record for API output.
     */
    private function formatSetting(Setting $setting): array
    {
        return [
            'key'           => $setting->key,
            'label'         => $setting->label,
            'value'         => Setting::cast($setting->value ?? $setting->default_value, $setting->type),
            'default_value' => Setting::cast($setting->default_value, $setting->type),
            'group'         => $setting->group,
            'type'          => $setting->type,
            'options'       => $setting->options,
            'description'   => $setting->description,
            'is_system'     => $setting->is_system,
            'is_modified'   => $setting->value !== $setting->default_value,
        ];
    }

    /**
     * Build validation rules based on setting type.
     */
    private function validationRules(Setting $setting, mixed $valueOverride = null): array
    {
        $base = match ($setting->type) {
            'boolean' => ['value' => 'required|in:true,false,1,0'],
            'integer' => ['value' => 'required|integer|min:0|max:100'],
            'decimal' => ['value' => 'required|numeric|min:0'],
            'json'    => ['value' => 'required'],
            'select'  => [
                'value' => 'required|string|in:' . implode(',', $setting->options ?? []),
            ],
            default   => ['value' => 'required|string|max:500'],
        };

        if (str_starts_with($setting->key, 'health_weight_')) {
            $base = ['value' => 'required|integer|min:0|max:100'];
        }

        if (str_starts_with($setting->key, 'health_threshold_')) {
            $base = ['value' => 'required|integer|min:0|max:100'];
        }

        return $base;
    }


    private function prepareValue(mixed $value, string $type): string
    {
        if ($type === 'json' && is_array($value)) {
            return json_encode($value);
        }

        return (string) $value;
    }
}
