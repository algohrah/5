# دليل استيراد قاعدة بيانات منصة توافق وربطها بهوستنجر (Hostinger)

هذا الدليل يشرح بالتفصيل كيفية استيراد قاعدة البيانات وتشغيل المشروع على هوستنجر دون أي أخطاء أو فقدان في البيانات.

---

## 1. الملفات المعتمدة للاستيراد
- **الملف الرئيسي الموحد الشامل**:
  `database_backup/hostinger_master_database.sql` (وكذلك نسخته المماثلة في جذر المشروع `tawafok_database.sql`).
- **المواصفات**:
  - يحتوي على كافة الجداول الـ 14 كاملة مع جميع الأعمدة الحديثة (`nickname`, `real_name`, `whatsapp`, `district`, `tribe`, `ethnicity`, `ethnicity_other`, `partner_specifications`, `details`).
  - ترميز موحد `utf8mb4_unicode_ci` لدعم اللغة العربية والرموز بنسبة 100%.
  - يتضمن حساب الإدارة الافتراضي، باقات الاشتراك، المدن الخليجية، بيانات تجريبية واقعية لأعضاء، وتذاكر دعم فني.

---

## 2. خطوات الاستيراد في هوستنجر (phpMyAdmin)
1. افتح لوحة تحكم **Hostinger (hPanel)**.
2. انتقل إلى قسم **Databases (قواعد البيانات) -> Management (الإدارة)**.
3. أنشئ قاعدة بيانات جديدة:
   - **Database Name**: مثلاً `u123456_tawafok`
   - **Username**: مثلاً `u123456_admin`
   - **Password**: عيّن كلمة مرور قوية واحفظها لاستخدامها في ملف `.env`.
4. اضغط على زر **Enter phpMyAdmin** بجانب قاعدة البيانات.
5. اضغط على تبويب **Import (استيراد)** في الشريط العلوي.
6. اضغط على **Choose File (اختيار ملف)** واختر الملف:
   `database_backup/hostinger_master_database.sql`
7. تأكد أن الترميز محدد على `utf-8` ثم اضغط على زر **Go / تنفيذ** بالأسفل.
8. ستظهر لك رسالة نجاح خضراء: `Import has been successfully finished`.

---

## 3. ربط ملف البيئة (.env) على هوستنجر
في مسار المشروع الرئيسي على خادم Node.js في هوستنجر، أنشئ ملف باسم `.env` أو عدّل المتغيرات في لوحة التحكم:

```env
PORT=3000
NODE_ENV=production

# إعدادات قاعدة بيانات Hostinger MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456_tawafok
DB_USER=u123456_admin
DB_PASSWORD=ضع_كلمة_المرور_هنا
```

---

## 4. بيانات الدخول الافتراضية
- **حساب الإدارة**:
  - البريد: `admin@tawafok.com`
  - كلمة المرور: `Tawafok@Admin2026`
- **حسابات الأعضاء النموذجية**:
  - `ahmed@tawafok.com` (كلمة المرور: `123456`)
  - `noura@tawafok.com` (كلمة المرور: `123456`)
  - `khalid@tawafok.com` (كلمة المرور: `123456`)
  - `sara@tawafok.com` (كلمة المرور: `123456`)
