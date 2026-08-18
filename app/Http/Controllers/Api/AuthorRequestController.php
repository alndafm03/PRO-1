<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthorRequest\ApplyAuthorRequestRequest;
use App\Models\Author_request;
use Illuminate\Http\Request;

class AuthorRequestController extends Controller
{
    /**
     * حالات الطلب التي لم تُحسم بعد (FR-40) — يمكن إلغاؤها، ولا يُسمح بطلب ترقية جديد أثناءها.
     */
    private const ACTIVE_STATUSES = ['pending', 'changes_requested', 'pre_approved'];

    /**
     * FR-39: عرض حالة طلبات الترقية كمؤلف المقدمة سابقًا.
     */
    public function myRequests(Request $request)
    {
        $requests = Author_request::query()
            ->upgrade()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json(['data' => $requests]);
    }

    /**
     * FR-38: تقديم طلب جديد للترقية إلى حساب مؤلف.
     */
    public function apply(ApplyAuthorRequestRequest $request)
    {
        $user = $request->user();

        if ($user->isAuthor()) {
            abort(422, 'أنت بالفعل مؤلف معتمد');
        }

        $hasActive = Author_request::query()
            ->upgrade()
            ->where('user_id', $user->id)
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->exists();

        if ($hasActive) {
            abort(422, 'لديك طلب ترقية قيد المعالجة بالفعل');
        }

        $workPdfs = [];
        foreach ($request->file('work_pdfs', []) as $file) {
            $path = $file->store('author_requests/work_pdfs', 'local');
            $workPdfs[] = ['path' => $path, 'size' => $file->getSize()];
        }

        $authorRequest = Author_request::create([
            'user_id' => $user->id,
            'request_type' => 'upgrade',
            'bio' => $request->validated('bio'),
            'description' => $request->validated('description'),
            'previous_works' => $request->validated('previous_works'),
            'work_pdfs' => $workPdfs,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'تم إرسال طلب الترشح بنجاح', 'data' => $authorRequest], 201);
    }

    /**
     * FR-39: عرض تفاصيل طلب انضمام محدد.
     */
    public function show(Request $request, Author_request $authorRequest)
    {
        if ($authorRequest->user_id !== $request->user()->id || ! $authorRequest->isUpgrade()) {
            abort(403, 'هذا الطلب لا يخصك');
        }

        return response()->json(['data' => $authorRequest]);
    }

    /**
     * FR-40: إلغاء طلب الانضمام كمؤلف طالما لم يُحسم بعد.
     */
    public function cancel(Request $request, Author_request $authorRequest)
    {
        if ($authorRequest->user_id !== $request->user()->id || ! $authorRequest->isUpgrade()) {
            abort(403, 'هذا الطلب لا يخصك');
        }

        if (! in_array($authorRequest->status, self::ACTIVE_STATUSES, true)) {
            abort(422, 'لا يمكن إلغاء طلب تم حسمه');
        }

        $authorRequest->delete();

        return response()->json(['message' => 'تم إلغاء الطلب بنجاح']);
    }
}
