<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\System_setting;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    /**
     * مفاتيح الإعدادات المسموح عرضها للزائر (Guest) - معلومات عامة عن المكتبة.
     */
    private const PUBLIC_KEYS = ['library_name', 'library_address', 'library_phone', 'working_hours'];

    /**
     * عرض المعلومات العامة عن المكتبة (لصفحة "معلومات المكتبة" التي يراها Guest).
     */
    public function publicInfo()
    {
        $settings = System_setting::whereIn('key', self::PUBLIC_KEYS)->pluck('value', 'key');

        return response()->json(['data' => $settings]);
    }

    /**
     * FR-49: استعلام عن نسبة أرباح المؤلفين الحالية.
     */
    public function getAuthorRevenuePercent()
    {
        return response()->json([
            'data' => [
                'author_revenue_percent' => (float) System_setting::getValue('author_revenue_percent', 0),
            ],
        ]);
    }

    /**
     * FR-49: تعديل نسبة أرباح المؤلفين. لا تؤثر على العمليات السابقة (BR-16: تُحفظ كـ snapshot).
     */
    public function setAuthorRevenuePercent(Request $request)
    {
        $validated = $request->validate([
            'value' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $setting = System_setting::setValue(
            'author_revenue_percent',
            (string) $validated['value'],
            $request->user()->id
        );

        return response()->json(['message' => 'تم تحديث نسبة أرباح المؤلفين', 'data' => $setting]);
    }

    /**
     * عرض شجرة كافة إعدادات النظام.
     */
    public function index()
    {
        return response()->json(['data' => System_setting::with('updatedBy')->get()]);
    }

    /**
     * تعديل قيمة إعداد محدد بالنظام عبر المفتاح.
     */
    public function update(Request $request, string $key)
    {
        $validated = $request->validate([
            'value' => ['required', 'string'],
        ]);

        $setting = System_setting::setValue($key, $validated['value'], $request->user()->id);

        return response()->json(['message' => 'تم تحديث الإعداد بنجاح', 'data' => $setting]);
    }
}
