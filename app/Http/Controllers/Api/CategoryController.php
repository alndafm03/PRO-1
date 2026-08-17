<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * FR-55: عرض قائمة جميع التصنيفات والأقسام الفعّالة (Guest).
     */
    public function index()
    {
        $categories = Category::query()->active()->orderBy('sort_order')->get();

        return response()->json(['data' => $categories]);
    }

    /**
     * FR-55: عرض جميع الكتب المنشورة التابعة لقسم محدد.
     */
    public function books(Request $request, Category $category)
    {
        $books = $category->books()
            ->published()
            ->with(['categories', 'author'])
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $books]);
    }

    /**
     * FR-55: إضافة قسم/تصنيف كتب جديد (Library Employee).
     */
    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());

        return response()->json(['message' => 'تم إضافة القسم بنجاح', 'data' => $category], 201);
    }

    /**
     * FR-55: تعديل اسم أو بيانات قسم موجود (Library Employee).
     */
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        return response()->json(['message' => 'تم تحديث القسم بنجاح', 'data' => $category]);
    }

    /**
     * FR-55: تفعيل أو إخفاء قسم من العرض (Library Employee).
     */
    public function toggleActive(Category $category)
    {
        $category->update(['is_active' => ! $category->is_active]);

        return response()->json(['message' => 'تم تحديث حالة القسم', 'data' => $category]);
    }
}
