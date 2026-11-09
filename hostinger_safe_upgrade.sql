-- =====================================================================
-- سكريبت الترقية الآمن لقاعدة بيانات منصة توافق (Hostinger phpMyAdmin)
-- هذا الملف مخصص لتحديث قاعدة البيانات الموجودة بالفعل دون مسح أو فقدان أي عضو
-- تم تصميمه بتقنية: Non-Destructive Update (لا يحذف جداول، لا يمسح صفوف الأعضاء)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- =====================================================================
-- الخطوة 1: ترقية جدول الأعضاء (members) وإضافة أي أعمدة ناقصة بأمان
-- =====================================================================

-- 1. الاسم المستعار والاسم الحقيقي (لحماية الخصوصية ومطابقة نموذج التسجيل)
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `nickname` VARCHAR(150) NULL AFTER `full_name`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `real_name` VARCHAR(150) NULL AFTER `nickname`;

-- 2. بيانات الاتصال والإقامة الدقيقة
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `whatsapp` VARCHAR(50) NULL AFTER `phone`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `district` VARCHAR(100) NULL AFTER `city`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `tribe` VARCHAR(150) NULL AFTER `district`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `ethnicity` VARCHAR(100) NULL AFTER `tribe`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `ethnicity_other` VARCHAR(150) NULL AFTER `ethnicity`;

-- 3. الحالة الصحية ومواصفات الشريك الموسعة
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `health` VARCHAR(100) NULL AFTER `skin_color`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `partner_specifications` TEXT NULL AFTER `partner_requirements`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `details` LONGTEXT NULL AFTER `partner_specifications`;

-- 4. نوع مصدر الحساب وكلمة المرور
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `source_type` VARCHAR(50) NOT NULL DEFAULT 'registered' AFTER `is_active`;
ALTER TABLE `members` MODIFY COLUMN `source_type` VARCHAR(50) NOT NULL DEFAULT 'registered';
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `password_hash` VARCHAR(255) NOT NULL DEFAULT '123456' AFTER `email`;

-- 5. توسيع قيود بعض الأعمدة حتى لا تسبب أي خطأ عند الحفظ
ALTER TABLE `members` MODIFY COLUMN `marital_status` VARCHAR(50) NOT NULL DEFAULT 'single';
ALTER TABLE `members` MODIFY COLUMN `marriage_type` VARCHAR(100) NOT NULL DEFAULT 'زواج معلن';
ALTER TABLE `members` MODIFY COLUMN `plan_id` VARCHAR(50) NOT NULL DEFAULT 'free';

-- =====================================================================
-- الخطوة 2: تحديث بيانات الأعضاء الـ 3 الحاليين دون المساس ببياناتهم السابقة
-- =====================================================================

-- تعبئة الاسم المستعار والاسم الحقيقي من الاسم الكامل إذا كانا فارغين
UPDATE `members` 
SET `nickname` = `full_name` 
WHERE `nickname` IS NULL OR `nickname` = '';

UPDATE `members` 
SET `real_name` = `full_name` 
WHERE `real_name` IS NULL OR `real_name` = '';

-- التأكد من وجود كلمة مرور صالحة لكل عضو تجريبي لتسهيل تسجيل دخوله
UPDATE `members` 
SET `password_hash` = '123456' 
WHERE `password_hash` IS NULL 
   OR `password_hash` = '' 
   OR `password_hash` = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

-- تحديث رقم الواتساب ليكون نفس رقم الهاتف إن كان فارغاً
UPDATE `members` 
SET `whatsapp` = `phone` 
WHERE (`whatsapp` IS NULL OR `whatsapp` = '') AND `phone` IS NOT NULL AND `phone` != '';

-- =====================================================================
-- الخطوة 3: إنشاء الجداول الجديدة (إن لم تكن موجودة مسبقاً)
-- =====================================================================

-- جدول المشرفين
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('super_admin', 'mediator', 'support') NOT NULL DEFAULT 'super_admin',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `last_login` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول باقات الاشتراكات
CREATE TABLE IF NOT EXISTS `plans` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'QAR',
  `period` VARCHAR(50) NOT NULL DEFAULT '30 يومًا',
  `duration_days` INT NOT NULL DEFAULT 30,
  `requests_limit` INT NOT NULL DEFAULT 5,
  `description` TEXT NULL,
  `features_json` TEXT NULL,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول طلبات التوافق والرقابة المالية
CREATE TABLE IF NOT EXISTS `requests` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `request_code` VARCHAR(50) NULL UNIQUE,
  `sender_id` VARCHAR(50) NOT NULL,
  `receiver_id` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `stage` VARCHAR(50) NOT NULL DEFAULT 'sent',
  `total_fee` DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
  `deposit_amount` DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  `sender_paid_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `receiver_paid_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `sender_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `receiver_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `sender_exempted` TINYINT(1) NOT NULL DEFAULT 0,
  `receiver_exempted` TINYINT(1) NOT NULL DEFAULT 0,
  `admin_notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_req_sender` (`sender_id`),
  INDEX `idx_req_receiver` (`receiver_id`),
  INDEX `idx_req_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول رحلات الخطوبة
CREATE TABLE IF NOT EXISTS `journeys` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `journey_code` VARCHAR(50) NOT NULL UNIQUE,
  `sender_id` INT UNSIGNED NOT NULL,
  `receiver_id` INT UNSIGNED NOT NULL,
  `current_step` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `step_name` VARCHAR(100) NOT NULL DEFAULT 'طلب التوافق المبدئي',
  `status` ENUM('pending', 'accepted', 'rejected', 'deposit_paid', 'coordination', 'viewing', 'final_payment', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `sender_deposit_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `receiver_deposit_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `sender_contact_shared` VARCHAR(255) NULL,
  `receiver_contact_shared` VARCHAR(255) NULL,
  `final_fee_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sender` (`sender_id`),
  INDEX `idx_receiver` (`receiver_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول أحداث الرحلة
CREATE TABLE IF NOT EXISTS `journey_events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `journey_id` INT UNSIGNED NOT NULL,
  `actor_type` ENUM('sender', 'receiver', 'admin', 'system') NOT NULL,
  `actor_id` INT UNSIGNED NULL,
  `event_title` VARCHAR(150) NOT NULL,
  `event_details` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_journey` (`journey_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول المعاملات المالية
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `reference_no` VARCHAR(100) NOT NULL UNIQUE,
  `member_id` INT UNSIGNED NOT NULL,
  `journey_id` INT UNSIGNED NULL,
  `type` ENUM('subscription', 'journey_deposit', 'journey_final_fee', 'other') NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'QAR',
  `payment_method` ENUM('credit_card', 'bank_transfer', 'apple_pay', 'paypal', 'crypto') NOT NULL DEFAULT 'credit_card',
  `payment_status` ENUM('completed', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'completed',
  `proof_image` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_member_tx` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT UNSIGNED NOT NULL,
  `type` ENUM('match', 'request', 'admin', 'verification', 'system') NOT NULL DEFAULT 'system',
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `link_url` VARCHAR(255) NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_member_read` (`member_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول تذاكر الدعم الفني
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_number` VARCHAR(50) NOT NULL UNIQUE,
  `member_id` INT UNSIGNED NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'استفسار عام',
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ticket_member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول رسائل الدعم
CREATE TABLE IF NOT EXISTS `ticket_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT UNSIGNED NOT NULL,
  `sender_type` ENUM('user', 'admin') NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول دليل الخطابات
CREATE TABLE IF NOT EXISTS `khataaba_directory` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'قطر',
  `city` VARCHAR(100) NOT NULL DEFAULT 'الدوحة',
  `phone` VARCHAR(50) NULL,
  `whatsapp` VARCHAR(50) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول إعدادات النظام
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول الكوبونات
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(10,2) NOT NULL,
  `valid_until` DATE NULL,
  `usage_limit` INT NOT NULL DEFAULT 100,
  `times_used` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول المدن
CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `country` VARCHAR(100) NOT NULL,
  `name_ar` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- الخطوة 4: تحديث وتثبيت البيانات التأسيسية بدون مسح أي حسابات سابقة
-- =====================================================================

-- حساب الإدارة المعتمد
INSERT INTO `admins` (`id`, `email`, `password_hash`, `full_name`, `role`, `status`) VALUES
(1, 'admin@tawafok.com', 'Tawafok@Admin2026', 'مدير منصة توافق', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- خطط العضوية
INSERT INTO `plans` (`id`, `name`, `price`, `currency`, `period`, `duration_days`, `requests_limit`, `description`, `features_json`, `is_popular`, `is_active`) VALUES
('free', 'الباقة المجانية', 0.00, 'QAR', 'للأبد', 365, 5, 'ابدأ بالبحث الأساسي وأرسل طلبات التوافق عبر المنصة.', '["5 طلبات توافق يوميًا","فلاتر الجنس والدولة والعمر والمدينة","المفضلة واستقبال الطلبات والإشعارات"]', 0, 1),
('featured', 'الباقة المميزة (شهر)', 99.00, 'QAR', '30 يومًا', 30, 20, 'فلاتر كاملة وطلبات أكثر وتمييز واضح لملفك.', '["20 طلب توافق يوميًا","جميع فلاتر البحث المتقدمة","شارة العضوية المميزة وقسم الأعضاء المميزون","أولوية ظهور بين الملفات المتقاربة"]', 1, 1),
('featured_1m', 'الباقة المميزة (شهر)', 99.00, 'QAR', '30 يومًا', 30, 20, 'فلاتر متقدمة وظهور في الصدارة.', '["20 طلب توافق يوميًا","أولوية التوافق","ظهور مميز"]', 0, 1),
('featured_6m', 'الباقة الذهبية (6 أشهر)', 499.00, 'QAR', '180 يومًا', 180, 50, 'ظهور مستمر ومتابعة متقدمة.', '["50 طلب توافق يوميًا","متابعة وسيط خاص","توثيق كامل"]', 0, 1),
('featured_1y', 'الباقة الماسية (سنة)', 899.00, 'QAR', '365 يومًا', 365, 100, 'أعلى درجات التمييز والأولوية طوال العام.', '["طلبات غير محدودة تقريباً","استشارات خاصة","أولوية مطلقة"]', 0, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- إعدادات النظام الرئيسية
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `category`, `description`) VALUES
('site_name', 'توافق - منصة وساطة الزواج الشرعي', 'general', 'اسم الموقع الرسمي'),
('site_currency', 'QAR', 'finance', 'العملة الرئيسية للموقع'),
('admin_whatsapp', '97455620331', 'contact', 'رقم واتساب الإدارة المعتمد للوساطة والتنسيق'),
('journey_deposit_fee', '500', 'finance', 'عربون بدء رحلة التوافق لكل طرف'),
('journey_final_fee', '2000', 'finance', 'أتعاب الإتمام عند مباركة الخطوبة'),
('enable_id_verification', 'true', 'security', 'تفعيل التحقق من الهوية الوطنية'),
('registration_open', 'true', 'general', 'حالة فتح باب التسجيل الجديد')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;

-- المدن الخليجية الرئيسية
INSERT INTO `cities` (`country`, `name_ar`, `is_active`) VALUES
('قطر', 'الدوحة', 1),
('قطر', 'الريان', 1),
('قطر', 'الوكرة', 1),
('قطر', 'الخور', 1),
('قطر', 'أم صلال', 1),
('السعودية', 'الرياض', 1),
('السعودية', 'جدة', 1),
('السعودية', 'مكة المكرمة', 1),
('السعودية', 'المدينة المنورة', 1),
('السعودية', 'الدمام', 1),
('السعودية', 'الخبر', 1),
('الإمارات', 'أبو ظبي', 1),
('الإمارات', 'دبي', 1),
('الإمارات', 'الشارقة', 1),
('الكويت', 'الكويت العاصمة', 1),
('الكويت', 'حولي', 1),
('البحرين', 'المنامة', 1),
('عمان', 'مسقط', 1);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- تم اكتمال الترقية الآمنة بنجاح:
-- جميع الأعضاء المسجلين سابقاً محفوظون بكامل بياناتهم،
-- وتمت إضافة كافة الأعمدة والجداول الجديدة دون أي تضارب!
-- =====================================================================
