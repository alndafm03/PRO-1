# 📚 نظام إدارة مكتبة متكامل (Library Management System API)

واجهة برمجية (API) متكاملة لمنصة مكتبة رقمية وورقية، مبنية باستخدام **Laravel 12**. يدعم النظام بيع الكتب وإعارتها (ورقيًا ورقميًا)، سير عمل نشر المؤلفين، حجز المقاعد، الغرامات، الدفع عبر Stripe، وطبقة إدارية متعددة الأدوار — كل ذلك عبر واجهة API نظيفة ومُنظّمة.
رابط النشر الفعلي: **Railway** — `https://pro-1-production.up.railway.app`

---

## 🎯 نظرة عامة

يحاكي هذا المشروع بيئة مكتبة واقعية يتفاعل فيها **خمسة أدوار مستخدمين مختلفة** مع نفس الكتالوج الأساسي، ولكل دور مجموعة صلاحيات وسير عمل مختلف:

| الدور | ماذا يستطيع أن يفعل |
|---|---|
| **القارئ (Reader)** | تصفح/البحث عن الكتب، الشراء أو الإعارة (ورقي/رقمي)، حجز المقاعد، إضافة تقييمات ومراجعات، متابعة الطلبات والغرامات |
| **المؤلف (Author)** | التقديم ليصبح مؤلفًا، إضافة كتبه وإدارتها، متابعة المبيعات والأرباح |
| **موظف مراجعة المحتوى** | مراجعة طلبات المؤلفين والموافقة عليها أو رفضها |
| **موظف المكتبة** | إدارة النسخ الورقية، تنفيذ عمليات البيع/الإعارة الحضورية، معالجة الإرجاع، التحقق من الدفعات، إدارة الغرامات |
| **الأدمن (Admin)** | إدارة المستخدمين والموظفين والمؤلفين والعروض والتصنيفات وإعدادات النظام، ومتابعة إحصائيات المنصة |

تتولى الواجهة البرمجية التعقيد التشغيلي وراء هذه العمليات: قفل المخزون لمنع البيع الزائد، الانتهاء التلقائي للطلبات غير المدفوعة والإعارات الرقمية المتأخرة، حساب الغرامات، تتبع عمولات المؤلفين، والتحقق من الدفع عبر Stripe webhooks.

---

## ✨ أبرز الميزات

- 🔐 **تحكم بالصلاحيات حسب الدور** عبر middleware مخصص لكل دور
- 🛒 **سلة شراء وإتمام طلب** تدعم سلال مختلطة (شراء + إعارة، ورقي + رقمي)
- 📖 **نظام إعارة مزدوج** — نسخ ورقية (بتواريخ استحقاق وغرامات) وإعارة رقمية (بانتهاء تلقائي)
- 💳 **تكامل دفع عبر Stripe** مع التحقق من توقيع الـ webhook، ومهمة مجدولة لإنهاء الدفعات المعلقة تلقائيًا
- 🪑 **نظام حجز مقاعد** مع قفل على مستوى الصف (row-level locking) لمنع الحجز المزدوج
- ✍️ **سير عمل نشر المؤلفين** — تقديم ← مراجعة محتوى ← قبول/رفض ← نشر
- 💰 **منطق غرامات وعمولات آلي** للإرجاع المتأخر وأرباح المؤلفين
- ⭐ **تقييمات ومراجعات**، مقتصرة على من اشترى/استعار الكتاب فعليًا
- 🔔 **نظام إشعارات** لأحداث الطلبات والدفع وحالة المراجعة
- 📊 **لوحة تحكم للأدمن** بإحصائيات مجمّعة عن المنصة
- 🔎 **بحث وتصفية** عبر الكتب والتصنيفات والعروض

---

## 🏗️ المعمارية والتقنيات المستخدمة

- **الإطار (Framework):** Laravel 12.39
- **المصادقة (Auth):** Laravel Sanctum (توكن API)
- **قاعدة البيانات:** MySQL
- **الدفع:** Stripe (Checkout Sessions + Webhooks)
- **الاستضافة:** Railway
- **الصلاحيات:** Laravel Policies + middleware حسب الدور
- **أمان التزامن (Concurrency):** قفل تشاؤمي (`lockForUpdate`) على العمليات الحساسة للمخزون (نسخ الكتب، المقاعد)
- **المهام المجدولة:** أوامر Artisan (`payments:expire-stale`، انتهاء الإعارة الرقمية) تعمل عبر Scheduler

### الكيانات الأساسية في النظام

```
User ──< Order ──< OrderItem >── Book ──< BorrowOption
  │         │                     │
  │         └──< Payment          ├──< BookFeedback
  │                                ├──< Seat / Reservation
  ├──< Borrowing (ورقي/رقمي)      ├──< BookCategory
  ├──< AuthorRequest                └──< Offer
  ├──< Notification
  └──< UserActivity
```

---

## 🚀 التشغيل محليًا

### المتطلبات

- PHP 8.2+
- Composer
- MySQL 8+
- حساب Stripe (مفاتيح وضع الاختبار كافية للتطوير المحلي)

### خطوات التثبيت

```bash
# 1. استنساخ المستودع
git clone https://github.com/<اسم-المستخدم>/<اسم-الريبو>.git
cd <اسم-الريبو>

# 2. تثبيت الحزم
composer install

# 3. نسخ ملف البيئة وإعداده
cp .env.example .env
php artisan key:generate

# 4. ضبط بيانات قاعدة البيانات ومفاتيح Stripe في .env
# DB_DATABASE, DB_USERNAME, DB_PASSWORD
# STRIPE_KEY, STRIPE_SECRET, STRIPE_WEBHOOK_SECRET

# 5. تشغيل المايجريشن وزرع بيانات تجريبية
php artisan migrate --seed

# 6. تشغيل السيرفر المحلي
php artisan serve
```

### متغيرات البيئة

راجع ملف [`.env.example`](.env.example) للقائمة الكاملة. أهم المتغيرات:

```env
APP_NAME="Library Management System"
APP_ENV=local
APP_KEY=
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=library_db
DB_USERNAME=root
DB_PASSWORD=

STRIPE_KEY=your_stripe_publishable_key
STRIPE_SECRET=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

PAYMENT_PENDING_EXPIRY_MINUTES=30
```


### تشغيل الجدولة (لانتهاء الدفعات/الإعارات تلقائيًا)

```bash
php artisan schedule:work
```

---

## 📡 نظرة على الـ API

الواجهة منظمة حول مجموعات مسارات مبنية على الموارد ومُقيّدة حسب الدور. أمثلة تمثيلية:

| المجموعة | أمثلة على المسارات |
|---|---|
| **عام / القارئ** | `GET /books`, `GET /books/{book}`, `GET /search`, `POST /cart`, `POST /orders/checkout` |
| **المؤلف** | `POST /author/books`, `GET /author/earnings`, `POST /author/request` |
| **موظف المكتبة** | `POST /employee/borrowings`, `POST /employee/returns`, `PATCH /employee/payments/{id}/verify` |
| **موظف مراجعة المحتوى** | `GET /content/submissions`, `PATCH /content/submissions/{id}/approve` |
| **الأدمن** | `GET /admin/dashboard`, `GET /admin/users`, `GET /admin/authors`, `POST /admin/offers` |
| **الدفع** | `POST /payments/checkout-session`, `POST /webhooks/stripe` |

---

## 🧪 الاختبارات

```bash
php artisan test
```

اختبارات الميزات (Feature Tests) تغطي المسارات الحرجة: المصادقة، إتمام الشراء، التحقق من الدفع، ودورة حياة الإعارة.

---

## 🧹 جودة الكود

```bash
# تنسيق الكود (Laravel Pint)
./vendor/bin/pint

# التحليل الساكن (Larastan)
./vendor/bin/phpstan analyse
```

---

## 🗺️ خطة التطوير القادمة

- [ ] إضافة تغطية اختبارات آلية لسير عمل نشر المؤلفين
- [ ] تحديد معدل الطلبات (Rate limiting) على مسارات البحث والتصفية
- [ ] بحث نصي كامل (اسم المؤلف + العنوان) عبر فهرسة مخصصة
- [ ] خط CI (GitHub Actions) يشغّل Pint + Larastan + الاختبارات على كل Pull Request

---


## 👤 المطوّر

**Mohammad Al-Nadaf**
[LinkedIn](https://www.linkedin.com/in/mohmmad-alndaf-7b4358368?utm_source=share_via&utm_content=profile&utm_medium=member_android)  · [GitHub](https://github.com/alndafm03)
