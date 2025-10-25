# تطبيق النحالين - Beekeeping Management App

تطبيق شامل لإدارة المناحل يهدف إلى تحويل عملية إدارة النحل من الطرق التقليدية إلى نظام رقمي ذكي يساعد النحالين المبتدئين والمحترفين.

## الميزات الرئيسية

- 🏠 **إدارة المناحل والخلايا** - تتبع تفصيلي لكل خلية ومواصفاتها
- 🔍 **نظام الفحص الذكي** - تقييم بالألوان والنقاط مع توصيات ذكية
- 🍯 **إدارة المنتجات** - تتبع العسل والغذاء الملكي وحبوب اللقاح والملكات
- 🌱 **مكتبة النباتات التشاركية** - معلومات شاملة عن النباتات المحلية
- 📱 **واجهة الحقل** - استخدام سهل أثناء العمل مع الخلايا
- 🗺️ **نظام الخرائط** - اكتشاف المناحل المجاورة والتواصل مع النحالين
- 📊 **التحليلات والتقارير** - إحصائيات مفصلة وتوقعات ذكية

## التقنيات المستخدمة

### Backend
- **Node.js** مع Express.js
- **PostgreSQL** لقاعدة البيانات الرئيسية
- **Sequelize** كـ ORM
- **JWT** للمصادقة والتفويض
- **Winston** للتسجيل
- **Joi** للتحقق من صحة البيانات

### Frontend (قادم)
- **React Native** للتطبيق المحمول
- **React** لتطبيق الويب

## متطلبات النظام

- Node.js >= 16.0.0
- PostgreSQL >= 12
- npm >= 8.0.0

## التثبيت والإعداد

### الطريقة الأولى: التشغيل المحلي

#### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd beekeeping-app
```

#### 2. تثبيت التبعيات
```bash
npm install
```

#### 3. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة بيانات PostgreSQL
createdb beekeeping_app

# أو باستخدام psql
psql -U postgres
CREATE DATABASE beekeeping_app;
```

#### 4. إعداد متغيرات البيئة
```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env

# تحرير الملف وإضافة القيم المناسبة
nano .env
```

#### 5. تشغيل التطبيق

##### وضع التطوير
```bash
npm run dev
```

##### وضع الإنتاج
```bash
npm run build
npm start
```

### الطريقة الثانية: التشغيل السريع

#### استخدام سكريبت التشغيل السريع
```bash
# تشغيل وضع التطوير (سيقوم بتثبيت التبعيات تلقائياً)
node start.js dev

# تشغيل الاختبارات
node start.js test

# عرض جميع الأوامر المتاحة
node start.js help
```

### الطريقة الثالثة: استخدام Docker

#### تشغيل بيئة التطوير
```bash
# تشغيل جميع الخدمات (قاعدة البيانات + التطبيق)
docker-compose --profile dev up -d

# مشاهدة السجلات
docker-compose logs -f app-dev
```

#### تشغيل بيئة الإنتاج
```bash
# تشغيل بيئة الإنتاج مع Nginx
docker-compose --profile prod up -d

# التحقق من حالة الخدمات
docker-compose ps
```

#### أوامر Docker مفيدة
```bash
# إيقاف جميع الخدمات
docker-compose down

# إعادة بناء التطبيق
docker-compose build app-dev

# تنظيف البيانات (احذر: سيحذف جميع البيانات)
docker-compose down -v
```

## متغيرات البيئة المطلوبة

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=beekeeping_app
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Maps (اختياري)
GOOGLE_MAPS_API_KEY=your_api_key
```

## API Endpoints

### المصادقة
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - الحصول على بيانات المستخدم الحالي
- `PUT /api/auth/profile` - تحديث الملف الشخصي

### المناحل
- `GET /api/apiaries` - قائمة المناحل
- `POST /api/apiaries` - إنشاء منحل جديد
- `GET /api/apiaries/:id` - تفاصيل منحل محدد
- `PUT /api/apiaries/:id` - تحديث منحل
- `DELETE /api/apiaries/:id` - حذف منحل

### الخلايا
- `GET /api/hives` - قائمة الخلايا
- `POST /api/hives` - إضافة خلية جديدة
- `GET /api/hives/:id` - تفاصيل خلية محددة
- `PUT /api/hives/:id` - تحديث خلية

## هيكل المشروع

```
beekeeping-app/
├── src/
│   ├── server/
│   │   ├── config/          # إعدادات قاعدة البيانات
│   │   ├── middleware/      # وسطاء Express
│   │   ├── models/          # نماذج Sequelize
│   │   ├── routes/          # مسارات API
│   │   ├── services/        # منطق الأعمال
│   │   ├── utils/           # أدوات مساعدة
│   │   └── index.js         # نقطة دخول الخادم
│   └── client/              # تطبيق العميل (قادم)
├── uploads/                 # ملفات المستخدمين
├── logs/                    # ملفات السجلات
├── .env.example             # نموذج متغيرات البيئة
├── package.json
└── README.md
```

## الاختبار

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات مع المراقبة
npm run test:watch

# تشغيل الاختبارات مع تقرير التغطية
npm run test:coverage

# تشغيل اختبارات الخدمات فقط
npm run test:services

# تشغيل الاختبارات باستخدام السكريبت السريع
node start.js test
```

## المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## الدعم

للحصول على الدعم أو الإبلاغ عن مشاكل:
- فتح Issue في GitHub
- التواصل عبر البريد الإلكتروني: support@beekeeping-app.com

## خارطة الطريق

- [x] إعداد البنية الأساسية
- [x] نظام المصادقة والتفويض
- [x] إدارة المناحل والخلايا الأساسية
- [ ] نظام الفحص والتقييم
- [ ] إدارة التغذية
- [ ] إدارة المنتجات
- [ ] نظام الخرائط والمجتمع
- [ ] تطبيق الهاتف المحمول
- [ ] مكتبة النباتات التشاركية

## الإصدارات

### v1.0.0 (قادم)
- إطلاق النسخة الأولى مع الميزات الأساسية
- تطبيق الويب الكامل
- تطبيق الهاتف المحمول

---

**ملاحظة:** هذا المشروع قيد التطوير النشط. الميزات والواجهات قد تتغير في الإصدارات القادمة.