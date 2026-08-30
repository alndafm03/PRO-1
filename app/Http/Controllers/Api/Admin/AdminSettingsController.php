<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SetAuthorRevenuePercentRequest;
use App\Http\Requests\Admin\UpdateSettingRequest;
use App\Models\System_setting;

class AdminSettingsController extends Controller
{
    private const PUBLIC_KEYS = ['library_name', 'library_address', 'library_phone', 'working_hours'];

    public function publicInfo()
    {
        $settings = System_setting::whereIn('key', self::PUBLIC_KEYS)->pluck('value', 'key');

        return response()->json(['data' => $settings]);
    }

    public function getAuthorRevenuePercent()
    {
        return response()->json([
            'data' => [
                'author_revenue_percent' => (float) System_setting::getValue('author_revenue_percent', 0),
            ],
        ]);
    }

    public function setAuthorRevenuePercent(SetAuthorRevenuePercentRequest $request)
    {
        $validated = $request->validated();

        $setting = System_setting::setValue(
            'author_revenue_percent',
            (string) $validated['value'],
            $request->user()->id
        );

        return response()->json(['message' => 'تم تحديث نسبة أرباح المؤلفين', 'data' => $setting]);
    }

    public function index()
    {
        return response()->json(['data' => System_setting::with('updatedBy')->get()]);
    }

    public function update(UpdateSettingRequest $request, string $key)
    {
        $validated = $request->validated();
        $setting = System_setting::setValue($key, $validated['value'], $request->user()->id);

        return response()->json(['message' => 'تم تحديث الإعداد بنجاح', 'data' => $setting]);
    }
}
