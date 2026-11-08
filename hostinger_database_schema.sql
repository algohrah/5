-- =====================================================================
-- سكريبت تحديث وإنشاء قاعدة بيانات منصة توافق (Hostinger MySQL)
-- متوافق تماماً مع phpMyAdmin وخوادم استضافة Hostinger
-- الترميز: utf8mb4_unicode_ci (دعم كامل للنصوص والأسماء واللغة العربية)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- =====================================================================
-- الجزء الأول: تحديث الجداول الحالية بأمان (دون حذف أو فقدان أي بيانات)
-- قم بتشغيل هذه الأوامر إذا كانت قاعدة البيانات لديك تحتوي بالفعل على أعضاء
-- =====================================================================

-- 1. إضافة الأعمدة الناقصة لجدول الأعضاء (members)
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `nickname` VARCHAR(150) NULL AFTER `full_name`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `real_name` VARCHAR(150) NULL AFTER `nickname`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `whatsapp` VARCHAR(50) NULL AFTER `phone`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `district` VARCHAR(100) NULL AFTER `city`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `tribe` VARCHAR(150) NULL AFTER `district`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `ethnicity` VARCHAR(100) NULL AFTER `tribe`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `ethnicity_other` VARCHAR(150) NULL AFTER `ethnicity`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `health` VARCHAR(100) NULL AFTER `skin_color`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `password_hash` VARCHAR(255) NOT NULL DEFAULT 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' AFTER `email`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `partner_specifications` TEXT NULL AFTER `partner_requirements`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `details` LONGTEXT NULL AFTER `partner_specifications`;
ALTER TABLE `members` ADD COLUMN IF NOT EXISTS `source_type` VARCHAR(50) NOT NULL DEFAULT 'registered' AFTER `is_active`;
ALTER TABLE `members` MODIFY COLUMN `source_type` VARCHAR(50) NOT NULL DEFAULT 'registered';

-- 2. ترقية السجلات السابقة للحفاظ على سلامة الاسم المستعار والاسم الحقيقي وكلمة المرور
-- نسخ الاسم الكامل الحالي للاسم المستعار والاسم الحقيقي إن كانا فارغين
UPDATE `members` SET `nickname` = `full_name` WHERE `nickname` IS NULL OR `nickname` = '';
UPDATE `members` SET `real_name` = `full_name` WHERE `real_name` IS NULL OR `real_name` = '';
-- تعيين كلمة مرور افتراضية للأعضاء الذين ليس لديهم كلمة مرور لتسهيل الدخول
UPDATE `members` SET `password_hash` = '123456' WHERE `password_hash` IS NULL OR `password_hash` = '' OR `password_hash` = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';


-- =====================================================================
-- الجزء الثاني: إنشاء الجداول كاملة لمن يرغب بإنشاء قاعدة بيانات جديدة
-- =====================================================================

-- 1. جدول المشرفين والإدارة (admins)
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

-- 2. جدول الأعضاء والمستخدمين الشامل (members)
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `member_code` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
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
  `age` TINYINT UNSIGNED NOT NULL,
  `height` SMALLINT UNSIGNED NULL,
  `weight` SMALLINT UNSIGNED NULL,
  `skin_color` VARCHAR(50) NULL,
  `health` VARCHAR(100) NULL,
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
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول طلبات التوافق والرقابة المالية (requests)
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

-- 4. جدول باقات الاشتراكات (plans)
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

-- 5. جدول إعدادات النظام (system_settings)
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
