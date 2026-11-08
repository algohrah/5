-- =====================================================================
-- قاعدة بيانات منصة توافق للزواج الشرعي (Tawafok Platform Database)
-- السكريبت الرئيسي الشامل والمعتمد للاستيراد المباشر في Hostinger (phpMyAdmin)
-- التشفير: utf8mb4_unicode_ci (دعم كامل وكامل للغة العربية والرموز التعبيرية)
-- الإصدار: 3.5.0 - متوافق بنسبة 100% مع خادم Node.js / Express وواجهة React
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- =====================================================================
-- 1. جدول المشرفين والإدارة (admins)
-- =====================================================================
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

-- =====================================================================
-- 2. جدول باقات الاشتراكات (plans)
-- =====================================================================
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

-- =====================================================================
-- 3. جدول الأعضاء والمستخدمين الشامل (members)
-- يحتوي على جميع الأعمدة والخصائص المطابقة تماماً لنموذج التسجيل والإدارة
-- =====================================================================
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `member_code` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL DEFAULT '123456',
  `full_name` VARCHAR(150) NOT NULL,
  `nickname` VARCHAR(150) NULL,
  `real_name` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NULL,
  `whatsapp` VARCHAR(50) NULL,
  `gender` ENUM('male', 'female') NOT NULL,
  `nationality` VARCHAR(100) NOT NULL DEFAULT 'قطري',
  `country` VARCHAR(100) NOT NULL DEFAULT 'قطر',
  `city` VARCHAR(100) NOT NULL DEFAULT 'الدوحة',
  `district` VARCHAR(100) NULL,
  `tribe` VARCHAR(150) NULL,
  `ethnicity` VARCHAR(100) NULL,
  `ethnicity_other` VARCHAR(150) NULL,
  `age` TINYINT UNSIGNED NOT NULL DEFAULT 25,
  `height` SMALLINT UNSIGNED NULL,
  `weight` SMALLINT UNSIGNED NULL,
  `skin_color` VARCHAR(50) NULL,
  `health` VARCHAR(100) NULL,
  `education` VARCHAR(100) NULL,
  `work_type` VARCHAR(100) NULL,
  `occupation` VARCHAR(150) NULL,
  `financial_status` VARCHAR(100) NULL,
  `marital_status` VARCHAR(50) NOT NULL DEFAULT 'single',
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
  `partner_specifications` TEXT NULL,
  `details` LONGTEXT NULL,
  `plan_id` VARCHAR(50) NOT NULL DEFAULT 'free',
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `source_type` VARCHAR(50) NOT NULL DEFAULT 'registered',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_gender_country` (`gender`, `country`),
  INDEX `idx_city` (`city`),
  INDEX `idx_age` (`age`),
  INDEX `idx_verified` (`is_verified`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_source` (`source_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. جدول طلبات التوافق والرقابة المالية (requests)
-- =====================================================================
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

-- =====================================================================
-- 5. جدول رحلات ومراحل الخطوبة الرسمية (journeys)
-- =====================================================================
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

-- =====================================================================
-- 6. جدول أحداث ومحطات الرحلة (journey_events)
-- =====================================================================
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

-- =====================================================================
-- 7. جدول المعاملات وسجل الدفع المالي (transactions)
-- =====================================================================
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

-- =====================================================================
-- 8. جدول الإشعارات المباشرة (notifications)
-- =====================================================================
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

-- =====================================================================
-- 9. جدول تذاكر الدعم والمساعدة (support_tickets)
-- =====================================================================
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

-- =====================================================================
-- 10. جدول رسائل الدعم الفني (ticket_messages)
-- =====================================================================
CREATE TABLE IF NOT EXISTS `ticket_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT UNSIGNED NOT NULL,
  `sender_type` ENUM('user', 'admin') NOT NULL,
  `sender_name` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 11. جدول دليل الخطابات والمكاتب المعتمدة (khataaba_directory)
-- =====================================================================
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

-- =====================================================================
-- 12. جدول إعدادات النظام الموحدة (system_settings)
-- =====================================================================
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 13. جدول كوبونات الخصم والعروض (coupons)
-- =====================================================================
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

-- =====================================================================
-- 14. جدول المدن المدعومة (cities)
-- =====================================================================
CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `country` VARCHAR(100) NOT NULL,
  `name_ar` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- البيانات التأسيسية والافتراضية (Default & Seed Data)
-- =====================================================================

-- 1. إضافة حساب الإدارة الافتراضي
-- كلمة المرور: Tawafok@Admin2026 (أو TawafokAdmin2026)
INSERT INTO `admins` (`id`, `email`, `password_hash`, `full_name`, `role`, `status`) VALUES
(1, 'admin@tawafok.com', 'Tawafok@Admin2026', 'مدير منصة توافق', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE `email` = `email`;

-- 2. إضافة خطط العضوية
INSERT INTO `plans` (`id`, `name`, `price`, `currency`, `period`, `duration_days`, `requests_limit`, `description`, `features_json`, `is_popular`, `is_active`) VALUES
('free', 'الباقة المجانية', 0.00, 'QAR', 'للأبد', 365, 5, 'ابدأ بالبحث الأساسي وأرسل طلبات التوافق عبر المنصة.', '["5 طلبات توافق يوميًا","فلاتر الجنس والدولة والعمر والمدينة","المفضلة واستقبال الطلبات والإشعارات"]', 0, 1),
('featured', 'الباقة المميزة (شهر)', 99.00, 'QAR', '30 يومًا', 30, 20, 'فلاتر كاملة وطلبات أكثر وتمييز واضح لملفك.', '["20 طلب توافق يوميًا","جميع فلاتر البحث المتقدمة","شارة العضوية المميزة وقسم الأعضاء المميزون","أولوية ظهور بين الملفات المتقاربة"]', 1, 1),
('featured_1m', 'الباقة المميزة (شهر)', 99.00, 'QAR', '30 يومًا', 30, 20, 'فلاتر متقدمة وظهور في الصدارة.', '["20 طلب توافق يوميًا","أولوية التوافق","ظهور مميز"]', 0, 1),
('featured_6m', 'الباقة الذهبية (6 أشهر)', 499.00, 'QAR', '180 يومًا', 180, 50, 'ظهور مستمر ومتابعة متقدمة.', '["50 طلب توافق يوميًا","متابعة وسيط خاص","توثيق كامل"]', 0, 1),
('featured_1y', 'الباقة الماسية (سنة)', 899.00, 'QAR', '365 يومًا', 365, 100, 'أعلى درجات التمييز والأولوية طوال العام.', '["طلبات غير محدودة تقريباً","استشارات خاصة","أولوية مطلقة"]', 0, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

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

-- 5. إدراج نماذج لأعضاء مسجلين جاهزين بكافة الحقول
INSERT INTO `members` (
  `id`, `member_code`, `email`, `password_hash`, `full_name`, `nickname`, `real_name`,
  `phone`, `whatsapp`, `gender`, `nationality`, `country`, `city`, `district`, `tribe`,
  `ethnicity`, `age`, `height`, `weight`, `skin_color`, `health`, `education`, `work_type`,
  `occupation`, `financial_status`, `marital_status`, `children_count`, `housing_type`,
  `sect`, `prayer_commitment`, `smoking`, `hijab_status`, `marriage_type`, `bio`,
  `partner_requirements`, `partner_specifications`, `details`, `plan_id`, `is_verified`, `is_featured`, `is_active`, `source_type`
) VALUES
(
  1, 'TW-1001', 'ahmed@tawafok.com', '123456', 'أحمد مبارك السليطي', 'أحمد السليطي', 'أحمد مبارك السليطي',
  '+97455123456', '+97455123456', 'male', 'قطري', 'قطر', 'الدوحة', 'الدفنة', 'السليطي',
  'قبيلي اصل فصل', 31, 178, 76, 'حنطي', 'سليم، الحمد لله.', 'بكالوريوس هندسة حاسوب', 'حكومي',
  'مهندس برمجيات', 'ممتاز', 'single', 0, 'أملك منزل',
  'سني', 'محافظ على جميع الصلوات في المسجد', 'no', NULL, 'زواج معلن',
  'شاب طموح وهادئ، محافظ على الصلاة والقيم الأسرية، أبحث عن الاستقرار وتكوين أسرة صالحة.',
  'إنسانة خلوقة، متعلمة، ذات دين وخلق وترغب في بناء بيت سعيد.',
  'قطرية أو خليجية، العمر بين 22 و28 سنة، متدينة ومحجبة.',
  '{"pCountry":"قطر","pCity":"الدوحة","pAgeMin":22,"pAgeMax":28,"pNationality":"قطري"}',
  'featured', 1, 1, 1, 'registered'
),
(
  2, 'TW-1002', 'noura@tawafok.com', '123456', 'نورة محمد آل ثاني', 'نورة آل ثاني', 'نورة محمد آل ثاني',
  '+97455987654', '+97455987654', 'female', 'قطري', 'قطر', 'الريان', 'الوجبة', 'آل ثاني',
  'قبيلي اصل فصل', 26, 162, 58, 'أبيض', 'سليمة، الحمد لله.', 'ماجستير إدارة أعمال', 'قطاع خاص',
  'مستشارة مالية', 'جيد جداً', 'single', 0, 'أسكن مع العائلة',
  'سني', 'محافظة على الصلوات', 'no', 'محجبة حجاب كامل', 'زواج معلن',
  'فتاة مثقفة تحب القراءة وتطوير الذات، ملتزمة دينياً واجتماعياً وتقدّر المودة والألفة.',
  'شاب جاد، متدين، مسؤول، يحترم المرأة ويقدر الحياة الزوجية والاستقرار.',
  'قطري، جامعي، مستقر وظيفياً ويخاف الله في تعامله.',
  '{"pCountry":"قطر","pCity":"لا يهم","pAgeMin":27,"pAgeMax":35,"pNationality":"قطري"}',
  'featured', 1, 1, 1, 'registered'
),
(
  3, 'TW-1003', 'khalid@tawafok.com', '123456', 'خالد بن ناصر القحطاني', 'خالد القحطاني', 'خالد بن ناصر القحطاني',
  '+966501234567', '+966501234567', 'male', 'سعودي', 'السعودية', 'الرياض', 'الملقا', 'قحطان',
  'قبيلي اصل فصل', 29, 175, 74, 'حنطي فاتح', 'سليم، الحمد لله.', 'بكالوريوس موارد بشرية', 'قطاع خاص',
  'مدير موارد بشرية', 'جيد جداً', 'single', 0, 'أستأجر',
  'سني', 'محافظ على الصلوات', 'no', NULL, 'زواج معلن',
  'رجل مسؤول وواضح، أقدر التفاهم والصدق في كل أمور الحياة والوضوح المتبادل.',
  'فتاة طيبة الأصل والخلق، تناسبني فكرياً وتشاركني الطموح وبناء أسرة كريمة.',
  'سعودية، متدينة، هادئة الطبع، لا مانع أن تكون موظفة.',
  '{"pCountry":"السعودية","pCity":"الرياض","pAgeMin":22,"pAgeMax":27,"pNationality":"سعودي"}',
  'free', 1, 0, 1, 'registered'
),
(
  4, 'TW-1004', 'sara@tawafok.com', '123456', 'سارة ناصر الدوسري', 'سارة الدوسري', 'سارة ناصر الدوسري',
  '+966509876543', '+966509876543', 'female', 'سعودي', 'السعودية', 'الدمام', 'الشاطئ', 'الدواسر',
  'قبيلي اصل فصل', 25, 165, 60, 'حنطي', 'سليمة، الحمد لله.', 'بكالوريوس لغة إنجليزية', 'حكومي',
  'معلمة', 'جيد', 'single', 0, 'أسكن مع العائلة',
  'سني', 'محافظة على الصلوات', 'no', 'محجبة حجاب كامل', 'زواج معلن',
  'هادئة ومتفائلة، أهتم بالتربية الصالحة وبناء حياة أسرية ملؤها المودة والرحمة.',
  'شخص على خلق ودين، محترم، ولديه وظيفة مستقرة ويتحمل المسؤولية.',
  'سعودي من المنطقة الشرقية أو الرياض، مقتدر ومحترم.',
  '{"pCountry":"السعودية","pCity":"الدمام","pAgeMin":26,"pAgeMax":32,"pNationality":"سعودي"}',
  'free', 1, 0, 1, 'registered'
)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 6. تذاكر دعم نموذجية
INSERT INTO `support_tickets` (`id`, `ticket_number`, `member_id`, `subject`, `category`, `priority`, `status`) VALUES
(1, 'TCK-2026-01', 1, 'استفسار عن توثيق الهوية الوطنية', 'توثيق الحساب', 'normal', 'resolved'),
(2, 'TCK-2026-02', 2, 'طلب معلومات عن باقة التميز', 'الاشتراكات', 'low', 'in_progress')
ON DUPLICATE KEY UPDATE `ticket_number` = VALUES(`ticket_number`);

INSERT INTO `ticket_messages` (`ticket_id`, `sender_type`, `sender_name`, `message`) VALUES
(1, 'user', 'أحمد السليطي', 'السلام عليكم، قمت برفع بطاقة الهوية، متى يتم اعتماد العلامة الزرقاء؟'),
(1, 'admin', 'الإدارة', 'وعليكم السلام، تم تدقيق الهوية وتوثيق حسابك بنجاح. شكراً لتعاونك.'),
(2, 'user', 'نورة آل ثاني', 'أرغب بمعرفة هل الباقة المميزة تمنحني إمكانية إرسال طلبات غير محدودة؟'),
(2, 'admin', 'الإدارة', 'أهلاً بك، الباقة المميزة تتيح 20 طلب توافق يومياً مع أولوية الظهور في نتائج البحث.');

-- 7. كوبون ترويجي افتراضي
INSERT INTO `coupons` (`code`, `discount_type`, `discount_value`, `valid_until`, `usage_limit`, `times_used`, `is_active`) VALUES
('WELCOME2026', 'percentage', 20.00, '2026-12-31', 500, 12, 1)
ON DUPLICATE KEY UPDATE `discount_value` = VALUES(`discount_value`);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- نهاية السكريبت المعتمد - جاهز تماماً للاستيراد في phpMyAdmin
-- =====================================================================
