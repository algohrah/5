-- =====================================================================
-- قاعدة بيانات منصة توافق للزواج الشرعي (Tawafok Platform Database)
-- مهيأة بالكامل لـ MySQL / MariaDB واستضافة هوستنجر (Hostinger phpMyAdmin)
-- التشفير: utf8mb4_unicode_ci (دعم كامل للنصوص والأسماء العربية)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ---------------------------------------------------------------------
-- 1. جدول المشرفين والإدارة (admins)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 2. جدول باقات الاشتراكات (plans)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `plans` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'QAR',
  `period` VARCHAR(50) NOT NULL DEFAULT '30 يومًا',
  `duration_days` INT NOT NULL DEFAULT 30,
  `requests_limit` INT NOT NULL DEFAULT 5,
  `description` TEXT,
  `features_json` TEXT,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. جدول الأعضاء والمستخدمين (members)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `member_code` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `gender` ENUM('male', 'female') NOT NULL,
  `nationality` VARCHAR(100) NOT NULL DEFAULT 'قطري',
  `country` VARCHAR(100) NOT NULL DEFAULT 'قطر',
  `city` VARCHAR(100) NOT NULL DEFAULT 'الدوحة',
  `age` TINYINT UNSIGNED NOT NULL,
  `height` SMALLINT UNSIGNED NULL,
  `weight` SMALLINT UNSIGNED NULL,
  `skin_color` VARCHAR(50) NULL,
  `education` VARCHAR(100) NULL,
  `work_type` VARCHAR(100) NULL,
  `occupation` VARCHAR(150) NULL,
  `financial_status` VARCHAR(100) NULL,
  `marital_status` VARCHAR(50) NOT NULL,
  `children_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `housing_type` VARCHAR(100) NULL,
  `sect` VARCHAR(50) NULL,
  `prayer_commitment` VARCHAR(100) NULL,
  `smoking` ENUM('yes', 'no') NOT NULL DEFAULT 'no',
  `hijab_status` VARCHAR(50) NULL,
  `beard_status` VARCHAR(50) NULL,
  `marriage_type` VARCHAR(100) NOT NULL DEFAULT 'زواج معلن',
  `accepts_polygamy` VARCHAR(50) NULL,
  `bio` TEXT NULL,
  `partner_requirements` TEXT NULL,
  `plan_id` VARCHAR(50) NOT NULL DEFAULT 'free',
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `source_type` ENUM('direct', 'imported', 'khataaba') NOT NULL DEFAULT 'direct',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_gender_country` (`gender`, `country`),
  INDEX `idx_city` (`city`),
  INDEX `idx_age` (`age`),
  INDEX `idx_verified` (`is_verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. جدول طلبات التوافق والرحلات (journeys / interest_requests)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 5. جدول أحداث وسجل مسار الرحلة (journey_events)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 6. جدول المعاملات المالية (transactions)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 7. جدول الإشعارات (notifications)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 8. جدول تذاكر الدعم الفني (support_tickets)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 9. جدول رسائل تذاكر الدعم (ticket_messages)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ticket_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT UNSIGNED NOT NULL,
  `sender_type` ENUM('user', 'admin') NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. جدول مكاتب الوساطة ودليل الخطابات (khataaba_directory)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `khataaba_directory` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'السعودية',
  `city` VARCHAR(100) NOT NULL DEFAULT 'الرياض',
  `phone` VARCHAR(50) NULL,
  `whatsapp` VARCHAR(50) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. جدول إعدادات النظام (system_settings)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. جدول كوبونات الخصم (coupons)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 13. جدول المدن المدعومة (cities)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `country` VARCHAR(100) NOT NULL,
  `name_ar` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- إدراج البيانات الأولية الافتراضية (Seed Data)
-- =====================================================================

-- 1. إضافة حساب المدير الرئيسي
-- كلمة المرور الافتراضية: Tawafok@Admin2026
-- البريد: admin@tawafok.com
INSERT INTO `admins` (`id`, `email`, `password_hash`, `full_name`, `role`, `status`) VALUES
(1, 'admin@tawafok.com', 'a28f4ff6cb3c8bb95b058a9e623eb6a0a03bb6fcfa4f40f09b5523d4bb548452', 'مدير منصة توافق', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE `email` = `email`;

-- 2. إضافة خطط العضوية
INSERT INTO `plans` (`id`, `name`, `price`, `currency`, `period`, `duration_days`, `requests_limit`, `description`, `features_json`, `is_popular`, `is_active`) VALUES
('free', 'الباقة المجانية', 0.00, 'QAR', 'للأبد', 365, 5, 'ابدأ بالبحث الأساسي وأرسل طلبات التوافق عبر المنصة.', '["5 طلبات توافق يوميًا","فلاتر الجنس والدولة والعمر والمدينة","المفضلة واستقبال الطلبات والإشعارات"]', 0, 1),
('featured', 'الباقة المميزة', 99.00, 'QAR', '30 يومًا', 30, 20, 'فلاتر كاملة وطلبات أكثر وتمييز واضح لملفك.', '["20 طلب توافق يوميًا","جميع فلاتر البحث المتقدمة","شارة العضوية المميزة وقسم الأعضاء المميزون","أولوية ظهور بين الملفات المتقاربة"]', 1, 1)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 3. إعدادات النظام الموحدة
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `category`, `description`) VALUES
('site_name', 'توافق - منصة وساطة الزواج الشرعي', 'general', 'اسم الموقع الرسمي'),
('site_currency', 'QAR', 'finance', 'العملة الرئيسية للموقع'),
('admin_whatsapp', '97455620331', 'contact', 'رقم واتساب الإدارة المعتمد للوساطة والتنسيق'),
('journey_deposit_fee', '500', 'finance', 'عربون بدء رحلة التوافق لكل طرف'),
('journey_final_fee', '2000', 'finance', 'أتعاب الإتمام عند مباركة الخطوبة'),
('enable_id_verification', 'true', 'security', 'تفعيل التحقق من الهوية الوطنية'),
('registration_open', 'true', 'general', 'حالة فتح باب التسجيل الجديد')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;

-- 4. إدراج المدن الخليجية والعربية الرئيسية
INSERT INTO `cities` (`country`, `name_ar`, `is_active`) VALUES
('قطر', 'الدوحة', 1),
('قطر', 'الريان', 1),
('قطر', 'الوكرة', 1),
('قطر', 'الخور', 1),
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

-- 5. إدراج نماذج لأعضاء مسجلين (عينة واقعية)
INSERT INTO `members` (`id`, `member_code`, `email`, `password_hash`, `full_name`, `phone`, `gender`, `nationality`, `country`, `city`, `age`, `height`, `weight`, `skin_color`, `education`, `work_type`, `occupation`, `financial_status`, `marital_status`, `children_count`, `housing_type`, `sect`, `prayer_commitment`, `smoking`, `hijab_status`, `marriage_type`, `bio`, `partner_requirements`, `plan_id`, `is_verified`, `is_featured`, `is_active`) VALUES
(1, 'TW-1001', 'ahmed@tawafok.com', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'أحمد السليطي', '+97455123456', 'male', 'قطري', 'قطر', 'الدوحة', 31, 178, 76, 'حنطي', 'بكالوريوس هندسة حاسوب', 'حكومي', 'مهندس برمجيات', 'ممتاز', 'single', 0, 'أملك منزل', 'سني', 'محافظ على جميع الصلوات في المسجد', 'no', NULL, 'زواج معلن', 'شاب طموح وهادئ، محافظ على الصلاة والقيم الأسرية، أبحث عن الاستقرار وتكوين أسرة صالحة.', 'إنسانة خلوقة، متعلمة، ذات دين وخلق وترغب في بناء بيت سعيد.', 'featured', 1, 1, 1),
(2, 'TW-1002', 'noura@tawafok.com', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'نورة آل ثاني', '+97455987654', 'female', 'قطري', 'قطر', 'الريان', 26, 162, 58, 'أبيض', 'ماجستير إدارة أعمال', 'قطاع خاص', 'مستشارة مالية', 'جيد جداً', 'single', 0, 'أسكن مع العائلة', 'سني', 'محافظة على الصلوات', 'no', 'محجبة حجاب كامل', 'زواج معلن', 'فتاة مثقفة تحب القراءة وتطوير الذات، ملتزمة دينياً واجتماعياً.', 'شاب جاد، متدين، مسؤول، يحترم المرأة ويقدر الحياة الزوجية.', 'featured', 1, 1, 1),
(3, 'TW-1003', 'khalid@tawafok.com', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'خالد القحطاني', '+966501234567', 'male', 'سعودي', 'السعودية', 'الرياض', 29, 175, 74, 'حنطي فاتح', 'بكالوريوس إدارة موارد بشرية', 'قطاع خاص', 'مدير قسم التوظيف', 'جيد جداً', 'single', 0, 'أستأجر', 'سني', 'محافظ على الصلوات', 'no', NULL, 'زواج معلن', 'رجل مسؤول وواضح، أقدر التفاهم والصدق في كل أمور الحياة.', 'فتاة طيبة الأصل والخلق، تناسبني فكرياً وتشاركني الطموح.', 'free', 1, 0, 1),
(4, 'TW-1004', 'sara@tawafok.com', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'سارة الدوسري', '+966509876543', 'female', 'سعودي', 'السعودية', 'الدمام', 25, 165, 60, 'حنطي', 'بكالوريوس لغة إنجليزية', 'حكومي', 'معلمة', 'جيد', 'single', 0, 'أسكن مع العائلة', 'سني', 'محافظة على الصلوات', 'no', 'محجبة حجاب كامل', 'زواج معلن', 'هادئة ومتفائلة، أهتم بالتربية الصالحة وبناء حياة أسرية ملؤها المودة والرحمة.', 'شخص على خلق ودين، محترم، ولديه وظيفة مستقرة.', 'free', 1, 0, 1);

-- 6. تذاكر دعم نموذجية
INSERT INTO `support_tickets` (`id`, `ticket_number`, `member_id`, `subject`, `category`, `priority`, `status`) VALUES
(1, 'TCK-2026-01', 1, 'استفسار عن توثيق الهوية الوطنية', 'توثيق الحساب', 'normal', 'resolved'),
(2, 'TCK-2026-02', 2, 'طلب معلومات عن باقة التميز', 'الاشتراكات', 'low', 'in_progress');

INSERT INTO `ticket_messages` (`ticket_id`, `sender_type`, `sender_name`, `message`) VALUES
(1, 'user', 'أحمد السليطي', 'السلام عليكم، قمت برفع بطاقة الهوية، متى يتم اعتماد العلامة الزرقاء؟'),
(1, 'admin', 'الإدارة', 'وعليكم السلام، تم تدقيق الهوية وتوثيق حسابك بنجاح. شكراً لتعاونك.'),
(2, 'user', 'نورة آل ثاني', 'أرغب بمعرفة هل الباقة المميزة تمنحني إمكانية إرسال طلبات غير محدودة؟'),
(2, 'admin', 'الإدارة', 'أهلاً بك، الباقة المميزة تتيح 20 طلب توافق يومياً مع أولوية الظهور في نتائج البحث.');

-- 7. كوبون ترويجي افتراضي
INSERT INTO `coupons` (`code`, `discount_type`, `discount_value`, `valid_until`, `usage_limit`, `times_used`, `is_active`) VALUES
('WELCOME2026', 'percentage', 20.00, '2026-12-31', 500, 12, 1);

SET FOREIGN_KEY_CHECKS = 1;
-- =====================================================================
-- تم إنشاء قاعدة البيانات بنجاح، وهي جاهزة للاستيراد في phpMyAdmin
-- =====================================================================
