-- ════════════════════════════════════════════════════════════════════════
-- AdConnect Database Setup Script
-- Run this AFTER the server is running.
-- Idempotent: safe to run multiple times.
-- ════════════════════════════════════════════════════════════════════════

-- ── 0. CREATE DATABASE ────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS `adconnect_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `adconnect_db`;

-- ════════════════════════════════════════════════════════════════════════
-- 1. CREATE TABLES (IF NOT EXISTS)
-- ════════════════════════════════════════════════════════════════════════

-- ── Users ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`           VARCHAR(20)  NOT NULL,
  `name`         VARCHAR(150) NOT NULL,
  `email`        VARCHAR(200) NOT NULL UNIQUE,
  `password`     VARCHAR(255) NOT NULL,
  `role`         ENUM('SUPER_ADMIN','ADMIN','EDITOR','GEN_USER') NOT NULL DEFAULT 'GEN_USER',
  `access_level` VARCHAR(10)  NOT NULL DEFAULT '0R00',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Clients (Leads) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `clients` (
  `id`                INT          AUTO_INCREMENT,
  `clientID`          VARCHAR(20)  NOT NULL UNIQUE,
  `clientName`        VARCHAR(200) NOT NULL,
  `clientEmail`       VARCHAR(200) NOT NULL,
  `clientPhone`       VARCHAR(30)  NOT NULL,
  `clientCity`        VARCHAR(150) DEFAULT NULL,
  `clientCompany`     VARCHAR(200) DEFAULT NULL,
  `clientStreet`      VARCHAR(200) DEFAULT NULL,
  `clientProvince`    VARCHAR(100) DEFAULT NULL,
  `clientZip`         VARCHAR(20)  DEFAULT NULL,
  `clientSource`      VARCHAR(100) DEFAULT 'Direct',
  `clientStatus`      VARCHAR(50)  DEFAULT '1ST CONTACT',
  `clientSubScription` VARCHAR(30) DEFAULT 'SUBSCRIBED',
  `created_at`        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Appointments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `appointments` (
  `id`                INT          AUTO_INCREMENT,
  `clientId`          VARCHAR(20)  NOT NULL UNIQUE,
  `name`              VARCHAR(200) DEFAULT NULL,
  `email`             VARCHAR(200) DEFAULT NULL,
  `phone`             VARCHAR(30)  DEFAULT NULL,
  `location`          VARCHAR(200) DEFAULT NULL,
  `appointmentDate`   VARCHAR(50)  DEFAULT NULL,
  `appointmentTime`   VARCHAR(80)  DEFAULT NULL,
  `appointmentType`   VARCHAR(100) DEFAULT 'Online Consultation',
  `appointmentStatus` VARCHAR(50)  DEFAULT 'PENDING',
  `appointmentNotes`  TEXT         DEFAULT NULL,
  `meetingLink`       VARCHAR(500) DEFAULT NULL,
  `created_at`        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Marketing Strategy Applications ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `marketing_strategy` (
  `id`                 INT          AUTO_INCREMENT,
  `applicationDate`    VARCHAR(20)  NOT NULL UNIQUE,
  `applicantFName`     VARCHAR(100) NOT NULL,
  `applicantLName`     VARCHAR(100) NOT NULL,
  `email`              VARCHAR(200) NOT NULL,
  `phone`              VARCHAR(30)  NOT NULL,
  `occupation`         VARCHAR(200) DEFAULT NULL,
  `marketTriggers`     TEXT         DEFAULT NULL,
  `strategyGoal`       TEXT         DEFAULT NULL,
  `strategyInvestment` VARCHAR(100) DEFAULT NULL,
  `status`             VARCHAR(50)  DEFAULT 'PENDING',
  `created_at`         DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── About / Team Profiles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `about` (
  `id`           VARCHAR(20)  NOT NULL,
  `title`        VARCHAR(300) NOT NULL,
  `introduction` TEXT         DEFAULT NULL,
  `experience`   TEXT         DEFAULT NULL,
  `mission`      TEXT         DEFAULT NULL,
  `status`       ENUM('ACTIVE','INACTIVE') DEFAULT 'INACTIVE',
  `icon`         VARCHAR(500) DEFAULT NULL,
  `updated_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Video ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `video` (
  `id`         VARCHAR(20)  NOT NULL,
  `title`      VARCHAR(300) NOT NULL,
  `created_by` VARCHAR(150) DEFAULT NULL,
  `video`      VARCHAR(500) DEFAULT NULL,
  `status`     ENUM('ACTIVE','INACTIVE') DEFAULT 'INACTIVE',
  `created_on` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Email Templates ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id`         INT          AUTO_INCREMENT,
  `status`     VARCHAR(50)  NOT NULL UNIQUE,
  `subject`    VARCHAR(300) NOT NULL,
  `body`       LONGTEXT     NOT NULL,
  `updated_at` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Blog Posts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id`           VARCHAR(20)  NOT NULL,
  `title`        VARCHAR(400) NOT NULL,
  `slug`         VARCHAR(400) DEFAULT NULL,
  `category`     VARCHAR(100) DEFAULT 'General',
  `status`       ENUM('DRAFT','PUBLISHED') DEFAULT 'DRAFT',
  `excerpt`      TEXT         DEFAULT NULL,
  `content`      LONGTEXT     DEFAULT NULL,
  `author`       VARCHAR(150) DEFAULT 'AdConnect Team',
  `cover_image`  VARCHAR(500) DEFAULT NULL,
  `view_count`   INT          DEFAULT 0,
  `created_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Portfolio Projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `projects` (
  `id`          VARCHAR(20)  NOT NULL,
  `name`        VARCHAR(300) NOT NULL,
  `type`        ENUM('Website','Android App','UI/UX Design','Software','Marketing') DEFAULT 'Website',
  `description` TEXT         NOT NULL,
  `tags`        JSON         DEFAULT NULL,
  `url`         VARCHAR(500) DEFAULT NULL,
  `thumbnail`   VARCHAR(500) DEFAULT NULL,
  `status`      ENUM('ACTIVE','DRAFT') DEFAULT 'ACTIVE',
  `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Testimonials ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `testimonials` (
  `id`            VARCHAR(20)  NOT NULL,
  `name`          VARCHAR(150) NOT NULL,
  `company`       VARCHAR(200) DEFAULT NULL,
  `text`          TEXT         NOT NULL,
  `stars`         TINYINT      DEFAULT 5,
  `photo`         VARCHAR(500) DEFAULT NULL,
  `status`        ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `display_order` INT          DEFAULT 0,
  `created_at`    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Site Settings (CMS) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id`            INT          AUTO_INCREMENT,
  `section`       VARCHAR(80)  NOT NULL DEFAULT 'homepage',
  `setting_key`   VARCHAR(100) NOT NULL,
  `setting_value` TEXT         DEFAULT NULL,
  `updated_at`    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_section_key` (`section`, `setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Contact Messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id`         INT          AUTO_INCREMENT,
  `messageId`  VARCHAR(20)  NOT NULL UNIQUE,
  `name`       VARCHAR(200) NOT NULL,
  `email`      VARCHAR(200) NOT NULL,
  `phone`      VARCHAR(30)  DEFAULT NULL,
  `message`    TEXT         NOT NULL,
  `status`     ENUM('UNREAD','READ','REPLIED','ARCHIVED') DEFAULT 'UNREAD',
  `reply_text` TEXT         DEFAULT NULL,
  `replied_at` DATETIME     DEFAULT NULL,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Job Listings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `jobs` (
  `id`           VARCHAR(20)  NOT NULL,
  `title`        VARCHAR(300) NOT NULL,
  `department`   VARCHAR(150) DEFAULT NULL,
  `type`         ENUM('Full-Time','Part-Time','Contract','Internship','Remote') DEFAULT 'Full-Time',
  `location`     VARCHAR(200) DEFAULT 'Nairobi, Kenya',
  `description`  LONGTEXT     NOT NULL,
  `requirements` LONGTEXT     DEFAULT NULL,
  `salary_range` VARCHAR(100) DEFAULT NULL,
  `deadline`     DATE         DEFAULT NULL,
  `status`       ENUM('OPEN','CLOSED','PAUSED') DEFAULT 'OPEN',
  `created_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Job Applications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `job_applications` (
  `id`              INT          AUTO_INCREMENT,
  `applicationId`   VARCHAR(20)  NOT NULL UNIQUE,
  `jobId`           VARCHAR(20)  NOT NULL,
  `job_title`       VARCHAR(300) DEFAULT NULL,
  `applicant_name`  VARCHAR(200) NOT NULL,
  `applicant_email` VARCHAR(200) NOT NULL,
  `applicant_phone` VARCHAR(30)  DEFAULT NULL,
  `cover_letter_note` TEXT       DEFAULT NULL,
  `cv_file`         VARCHAR(500) NOT NULL COMMENT 'Path to combined PDF (CV + Cover Letter + Certificates)',
  `status`          ENUM('PENDING','UNDER_REVIEW','SHORTLISTED','INVITED','REJECTED','HIRED') DEFAULT 'PENDING',
  `interview_date`  DATETIME     DEFAULT NULL,
  `interview_link`  VARCHAR(500) DEFAULT NULL,
  `admin_notes`     TEXT         DEFAULT NULL,
  `invited_at`      DATETIME     DEFAULT NULL,
  `created_at`      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Job Listings Table
CREATE TABLE IF NOT EXISTS career_listings (
    id           VARCHAR(20)  PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    department   VARCHAR(100) NOT NULL,
    type         ENUM('Full-time','Part-time','Contract','Internship') DEFAULT 'Full-time',
    location     VARCHAR(150) DEFAULT 'Nairobi',
    mode         ENUM('On-site','Remote','Hybrid') DEFAULT 'On-site',
    salary       VARCHAR(100),
    description  TEXT NOT NULL,
    requirements TEXT,
    deadline     DATE,
    status       ENUM('OPEN','CLOSED','PAUSED') DEFAULT 'OPEN',
    pinned       TINYINT DEFAULT 0,
    tags         JSON,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_dept   (department)
);

-- Career Applications Table
CREATE TABLE IF NOT EXISTS career_applications (
    id               VARCHAR(20)  PRIMARY KEY,
    job_id           VARCHAR(20)  NOT NULL,
    job_title        VARCHAR(255),
    job_department   VARCHAR(100),
    first_name       VARCHAR(100) NOT NULL,
    last_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(30),
    current_role     VARCHAR(200),
    experience       VARCHAR(50),
    motivation       TEXT,
    portfolio        VARCHAR(500),
    cv_filename      VARCHAR(300),
    status           ENUM('PENDING','REVIEWING','SHORTLISTED','INTERVIEW','REJECTED','HIRED') DEFAULT 'PENDING',
    admin_notes      TEXT,
    interview_date   DATETIME,
    interview_notes  TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_job_id (job_id),
    INDEX idx_status (status),
    INDEX idx_email  (email)
);

==═══════════════════════════════════════════════════════════════════════
-- New Table: Page Views (for Analytics)
-- This table will store page view events for analytics purposes.
-- It captures the page name, path, session ID, IP address, user agent, referrer, UTM parameters, and timestamp.
-- This will allow us to analyze user behavior, traffic sources, and campaign performance.
-- Note: In a production environment, consider data privacy and compliance when storing IP addresses and user agents.
--═══════════════════════════════════════════════════════════════════════
CREATE TABLE page_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_name VARCHAR(255) NOT NULL,
    page_path VARCHAR(255),
    session_id VARCHAR(100),
    ip_address VARCHAR(45),         -- supports IPv4 + IPv6
    user_agent TEXT,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════
-- 2. ALTER EXISTING TABLES — ADD MISSING COLUMNS IF NOT EXIST
-- (Idempotent via stored procedure)
-- ════════════════════════════════════════════════════════════════════════

DROP PROCEDURE IF EXISTS `add_column_if_not_exists`;
DELIMITER $$
CREATE PROCEDURE `add_column_if_not_exists`(
  IN tbl VARCHAR(100),
  IN col VARCHAR(100),
  IN col_def TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = tbl
      AND COLUMN_NAME  = col
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- users
CALL add_column_if_not_exists('users','role',      "ENUM('SUPER_ADMIN','ADMIN','EDITOR','GEN_USER') NOT NULL DEFAULT 'GEN_USER' AFTER password");
CALL add_column_if_not_exists('users','updated_at',"DATETIME ON UPDATE CURRENT_TIMESTAMP AFTER created_at");

-- clients
CALL add_column_if_not_exists('clients','clientCity',    "VARCHAR(150) DEFAULT NULL AFTER clientPhone");
CALL add_column_if_not_exists('clients','clientCompany', "VARCHAR(200) DEFAULT NULL AFTER clientCity");
CALL add_column_if_not_exists('clients','clientStreet',  "VARCHAR(200) DEFAULT NULL AFTER clientCompany");
CALL add_column_if_not_exists('clients','clientProvince',"VARCHAR(100) DEFAULT NULL AFTER clientStreet");
CALL add_column_if_not_exists('clients','clientZip',     "VARCHAR(20) DEFAULT NULL AFTER clientProvince");
CALL add_column_if_not_exists('clients','updated_at',    "DATETIME ON UPDATE CURRENT_TIMESTAMP AFTER created_at");

-- appointments
CALL add_column_if_not_exists('appointments','meetingLink', "VARCHAR(500) DEFAULT NULL AFTER appointmentNotes");
CALL add_column_if_not_exists('appointments','updated_at',  "DATETIME ON UPDATE CURRENT_TIMESTAMP AFTER created_at");

-- about
CALL add_column_if_not_exists('about','updated_at', "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER icon");

-- blog_posts
CALL add_column_if_not_exists('blog_posts','slug',        "VARCHAR(400) DEFAULT NULL AFTER title");
CALL add_column_if_not_exists('blog_posts','cover_image', "VARCHAR(500) DEFAULT NULL AFTER author");
CALL add_column_if_not_exists('blog_posts','view_count',  "INT DEFAULT 0 AFTER cover_image");
CALL add_column_if_not_exists('blog_posts','updated_at',  "DATETIME ON UPDATE CURRENT_TIMESTAMP AFTER created_at");

-- contact_messages
CALL add_column_if_not_exists('contact_messages','phone',      "VARCHAR(30) DEFAULT NULL AFTER email");
CALL add_column_if_not_exists('contact_messages','status',     "ENUM('UNREAD','READ','REPLIED','ARCHIVED') DEFAULT 'UNREAD' AFTER message");
CALL add_column_if_not_exists('contact_messages','reply_text', "TEXT DEFAULT NULL AFTER status");
CALL add_column_if_not_exists('contact_messages','replied_at', "DATETIME DEFAULT NULL AFTER reply_text");
CALL add_column_if_not_exists('contact_messages','updated_at', "DATETIME ON UPDATE CURRENT_TIMESTAMP AFTER created_at");

-- marketing_strategy
CALL add_column_if_not_exists('marketing_strategy','updated_at', "DATETIME ON UPDATE CURRENT_TIMESTAMP AFTER created_at");

DROP PROCEDURE IF EXISTS `add_column_if_not_exists`;

-- ════════════════════════════════════════════════════════════════════════
-- 3. SEED DATA (INSERT IGNORE — safe to re-run)
-- ════════════════════════════════════════════════════════════════════════

-- ── Default Super Admin ───────────────────────────────────────────────
INSERT IGNORE INTO `users` (`id`,`name`,`email`,`password`,`role`,`access_level`,`created_at`) VALUES
('202401010001','Super Admin','admin@adconnect.co.ke','Admin@2024!','SUPER_ADMIN','CRUD',NOW()),
('202401010002','Misgina Fitwi','misgina@adconnect.co.ke','Misgina@2024!','ADMIN','CRUD',NOW()),
('202401010003','Editor User','editor@adconnect.co.ke','Editor@2024!','EDITOR','0RU0',NOW());

-- ── About / Team Profiles ─────────────────────────────────────────────
INSERT IGNORE INTO `about` (`id`,`title`,`introduction`,`experience`,`mission`,`status`,`icon`,`updated_at`) VALUES
(
  '202401010010',
  'Misgina Fitwi — Digital Marketing Specialist',
  'Hello! I''m Misgina Fitwi, a digital marketing specialist dedicated to helping real estate companies thrive in the digital landscape. I studied Digital Marketing at Oslo Kristiania University, where I honed my skills in social media advertising, data analysis, and consumer behaviour.',
  'With over four years of hands-on experience, I have developed and executed successful social media ad campaigns that significantly increased visibility and sales for clients. My approach is data-driven, ensuring that every campaign is optimised for maximum performance and ROI.',
  'At AdConnect, our mission is to empower real estate businesses by leveraging the full potential of digital marketing. We believe in building long-term relationships with our clients, providing them with the tools and insights they need to succeed.',
  'ACTIVE',
  '/resources/misgina.png',
  NOW()
),
(
  '202401010011',
  'Michael Maina — Full-Stack Software Engineer',
  'I''m Michael, a full-stack software engineer passionate about building scalable web applications, Android apps, and CRM platforms. I turn ideas into production-grade digital products using clean, maintainable code and thoughtful system architecture.',
  '3+ years building production-ready web and mobile applications using React, Node.js, Java, and Kotlin. I''ve delivered custom CRM systems, booking platforms, and e-commerce solutions for clients across Kenya and East Africa.',
  'My goal is to bridge the gap between powerful marketing strategies and the technology that makes them scalable — delivering digital products that are fast, reliable, and beautiful.',
  'ACTIVE',
  '/resources/pic-back.png',
  NOW()
);

-- ── Email Templates ───────────────────────────────────────────────────
INSERT IGNORE INTO `email_templates` (`status`,`subject`,`body`) VALUES
(
  '1ST CONTACT',
  'Welcome to AdConnect – Your Partner in Real Estate Marketing Success 🎉',
  '<body style="font-family:Arial,sans-serif;color:#fff;padding:20px"><div style="max-width:600px;margin:0 auto;padding:20px;background:linear-gradient(to right,#4d4c4b,#646464);border-radius:10px;"><p>Hello <strong>${clientName}</strong>, Misgina Fitwi Here,</p><p>Welcome to <a href="https://adconnect.co.ke" style="color:#4abc4f;font-weight:bold;text-decoration:none;">AdConnect!</a> We''re thrilled to have you on board 🎉.</p><p>Our mission is simple: to help real estate companies like yours succeed through powerful, targeted ads, professional social media management, and more.</p><p>Here''s what you can expect:</p><ul><li>✔️ Proven strategies to attract and convert leads through Facebook and social media advertising.</li><li>🔧 Expert support from our experienced developers, content editors, and marketing professionals.</li><li>💡 Ongoing guidance to keep your digital marketing at the cutting edge.</li></ul><p><a href="https://adconnect.co.ke/index.html?value-video-opt-in=true" style="display:inline-block;padding:5px 30px;background-color:#f65730;color:white;font-weight:bold;border-radius:15px;text-decoration:none;">Book a Free Consultation Today</a></p><p>Warm regards,<br/>Misgina Fitwi<br/><a href="https://adconnect.co.ke" style="color:#4abc4f;text-decoration:none;">Adconnect Team</a><br/>Phone: 0790064130</p></div></body>'
),
(
  '2ND CONTACT',
  'Following Up – Are You Ready to Scale Your Real Estate Leads?',
  '<body style="font-family:Arial,sans-serif;color:#fff;padding:20px"><div style="max-width:600px;margin:0 auto;padding:20px;background:linear-gradient(to right,#4d4c4b,#646464);border-radius:10px;"><p>Hello <strong>${clientName}</strong>,</p><p>We wanted to check in and see if you''ve had a chance to explore our free strategy video. Many of our clients have transformed their real estate businesses just by implementing a few of the techniques we share.</p><p>Would you be open to a quick 15-minute call this week? We''d love to walk you through how we can specifically help your business.</p><p><a href="https://adconnect.co.ke?appointment-booking=true" style="display:inline-block;padding:5px 30px;background-color:#f65730;color:white;font-weight:bold;border-radius:15px;text-decoration:none;">Book Your Free Call</a></p><p>Best regards,<br/>Misgina Fitwi · AdConnect</p></div></body>'
),
(
  '3RD CONTACT',
  'One Last Thing – A Special Offer for You',
  '<body style="font-family:Arial,sans-serif;color:#fff;padding:20px"><div style="max-width:600px;margin:0 auto;padding:20px;background:linear-gradient(to right,#4d4c4b,#646464);border-radius:10px;"><p>Hello <strong>${clientName}</strong>,</p><p>We know you''re busy, so we''ll keep this short. We''re offering a complimentary marketing audit for a limited number of real estate companies this month.</p><p>In 30 minutes, we''ll identify the biggest gaps in your current marketing and share exactly what''s working for top-performing real estate businesses right now.</p><p><a href="https://adconnect.co.ke?lead-capture-form=true" style="display:inline-block;padding:5px 30px;background-color:#f65730;color:white;font-weight:bold;border-radius:15px;text-decoration:none;">Claim Your Free Audit</a></p><p>Warm regards,<br/>Misgina Fitwi · AdConnect</p></div></body>'
);

-- ── Site Settings ─────────────────────────────────────────────────────
INSERT IGNORE INTO `site_settings` (`section`,`setting_key`,`setting_value`) VALUES
('homepage','hero_eyebrow',      'Kenya''s #1 Real Estate Marketing Agency'),
('homepage','hero_headline',     'Powering <span class="accent">Real Estate</span> Businesses with <span class="accent-g">HI-ROI</span> Digital Marketing'),
('homepage','hero_subheadline',  'Boost your lead generation, reduce ad costs, and grow your real estate business with tailored ad strategies across Facebook, Instagram, Google and beyond.'),
('homepage','hero_cta_primary',  'Watch Free Strategy Video'),
('homepage','hero_cta_secondary','Book Free Consultation'),
('homepage','stat_clients',      '50+'),
('homepage','stat_roi',          '200%'),
('homepage','result_1',          '200%'),
('homepage','result_1_label',    'Average ROI Increase'),
('homepage','result_2',          '50+'),
('homepage','result_2_label',    'Real Estate Clients Served'),
('homepage','result_3',          '60%'),
('homepage','result_3_label',    'Average Ad Cost Reduction'),
('homepage','result_4',          '4+'),
('homepage','result_4_label',    'Years of Expertise'),
('homepage','video_headline',    '5 Proven Strategies to Generate More Real Estate Leads'),
('homepage','video_subheadline', 'Discover how to reduce your ad spend and attract higher-quality property leads in this exclusive 5-minute video.');

-- ── Testimonials ──────────────────────────────────────────────────────
INSERT IGNORE INTO `testimonials` (`id`,`name`,`company`,`text`,`stars`,`status`,`display_order`) VALUES
('t001','Irene Nyokabi','Elixir Salon & Spa','"AdConnect has been instrumental in helping us reach our target audience and generate high-quality leads. Their team is professional, responsive, and always delivers on time. Our bookings increased by 180% within the first 3 months!"',5,'ACTIVE',1),
('t002','Eng. James','Ricosam Engineering','"Our project involved integrating multiple third-party APIs. AdConnect handled it flawlessly and optimised the process to ensure fast load times. Their technical expertise is truly impressive."',5,'ACTIVE',2),
('t003','John Kamau','Songa Real Estate','"Our company required a custom web application and AdConnect delivered beyond expectations. Their developers were thorough and the application is intuitive and scalable."',4,'ACTIVE',3),
('t004','Dr. Sam Smith','Smith Properties','"Their digital marketing campaigns transformed my real estate business. From Google Ads to social media, their strategies brought measurable results — 200% increase in qualified leads within 6 months."',4,'ACTIVE',4),
('t005','Ladybird','Nuloft Salon & Spa','"What I love most about AdConnect is their reliability. They provide ongoing support and guidance long after going live. Maintenance and updates have kept my site flawless."',5,'ACTIVE',5),
('t006','Michael Waweru','Oriss Company','"I was skeptical about SEO at first, but AdConnect changed my perspective. Within four months, my website ranked on the first page of Google for several key search terms, directly translating into more sales."',5,'ACTIVE',6);

-- ── Portfolio Projects ────────────────────────────────────────────────
INSERT IGNORE INTO `projects` (`id`,`name`,`type`,`description`,`tags`,`url`,`status`,`created_at`) VALUES
('p001','Elixir Salon & Spa Website','Website','Full-stack website with online booking system, service catalogue, gallery, and contact forms for a premium Nairobi salon and spa.','["HTML","CSS","JavaScript","Node.js","MySQL"]','#','ACTIVE',NOW()),
('p002','Ricosam Engineering','Website','Corporate website for an engineering firm featuring project portfolios, team profiles, service pages, and client inquiry forms with CRM integration.','["React","Node.js","MySQL","AWS"]','#','ACTIVE',NOW()),
('p003','Property Finder App','Android App','Android application for real estate property discovery with location-based search, advanced filters, virtual tour links, and direct agent contact.','["Kotlin","Firebase","Google Maps","REST API"]','','ACTIVE',NOW()),
('p004','Real Estate CRM Dashboard','UI/UX Design','Figma UI/UX design for a comprehensive CRM dashboard helping real estate teams manage leads, appointments, and client relationships at scale.','["Figma","UI/UX","Prototyping","User Research"]','#','ACTIVE',NOW()),
('p005','AdConnect Admin Platform','Software','Full-featured admin dashboard with role-based access, live analytics, CRM, blog & portfolio management, built with Node.js and vanilla JS.','["Node.js","MySQL","JavaScript","Chart.js","REST API"]','','ACTIVE',NOW()),
('p006','Nuloft Salon Facebook Campaign','Marketing','Targeted Facebook and Instagram advertising campaign that grew client bookings by 180% and reduced cost-per-lead by 65% in 3 months.','["Facebook Ads","Meta Pixel","A/B Testing","Audience Targeting"]','','ACTIVE',NOW());

-- ── Job Listings ──────────────────────────────────────────────────────
INSERT IGNORE INTO `jobs` (`id`,`title`,`department`,`type`,`location`,`description`,`requirements`,`salary_range`,`deadline`,`status`) VALUES
(
  'j001',
  'Digital Marketing Specialist',
  'Marketing',
  'Full-Time',
  'Nairobi, Kenya (Hybrid)',
  'We are looking for a passionate Digital Marketing Specialist to join our growing team at AdConnect. You will be responsible for planning, executing, and optimising paid advertising campaigns across Facebook, Instagram, Google, and TikTok for our real estate clients.\n\nKey Responsibilities:\n• Design and manage performance-driven social media ad campaigns\n• Conduct audience research and build targeted ad sets\n• Monitor campaign KPIs daily and optimise for maximum ROI\n• Write compelling ad copy and collaborate with designers on creatives\n• Prepare weekly performance reports for clients\n• Stay up-to-date with platform algorithm changes and best practices',
  '• 2+ years experience in paid social media advertising (Facebook/Meta Ads required)\n• Proficiency with Meta Business Manager and Google Ads\n• Strong analytical skills and experience with Meta Pixel, Google Analytics, and GTM\n• Excellent written communication skills in English\n• Ability to manage multiple client campaigns simultaneously\n• Experience in real estate marketing is a strong plus',
  'KES 60,000 – 90,000 / month',
  DATE_ADD(CURDATE(), INTERVAL 30 DAY),
  'OPEN'
),
(
  'j002',
  'Full-Stack Web Developer',
  'Development',
  'Full-Time',
  'Nairobi, Kenya (On-site)',
  'AdConnect is seeking a talented Full-Stack Web Developer to build and maintain websites, web applications, and internal tools for our agency and clients. You will work closely with our design and marketing teams to deliver high-quality digital products.\n\nKey Responsibilities:\n• Develop responsive, high-performance websites and web applications\n• Build and maintain RESTful APIs using Node.js/Express\n• Manage MySQL databases and write optimised queries\n• Integrate third-party services (payment gateways, CRMs, APIs)\n• Implement SEO best practices at the code level\n• Conduct code reviews and maintain documentation',
  '• 2+ years of professional web development experience\n• Proficiency in HTML, CSS, JavaScript, Node.js, and Express\n• Strong MySQL/relational database skills\n• Experience with React or Vue.js frameworks\n• Familiarity with Git version control and CI/CD pipelines\n• Understanding of web security best practices\n• Experience with cloud hosting (AWS, DigitalOcean, or similar)',
  'KES 80,000 – 120,000 / month',
  DATE_ADD(CURDATE(), INTERVAL 45 DAY),
  'OPEN'
),
(
  'j003',
  'UI/UX Designer',
  'Design',
  'Contract',
  'Remote (Kenya)',
  'We are looking for a creative UI/UX Designer to craft beautiful, user-centred interfaces for our clients'' websites, mobile apps, and marketing materials. You will translate business requirements and user research into intuitive, visually compelling designs.\n\nKey Responsibilities:\n• Create wireframes, prototypes, and high-fidelity mockups in Figma\n• Conduct user research and usability testing\n• Develop and maintain design systems and component libraries\n• Collaborate with developers to ensure faithful implementation\n• Design marketing materials (social media graphics, ad creatives, presentations)\n• Iterate on designs based on feedback and data',
  '• Portfolio demonstrating strong UI/UX work across web and mobile\n• Proficiency in Figma (required), Adobe XD or Sketch a plus\n• Understanding of UX principles, accessibility standards, and responsive design\n• Experience creating design systems and component libraries\n• Basic understanding of HTML/CSS to communicate effectively with developers\n• Strong attention to detail and ability to meet deadlines',
  'KES 50,000 – 80,000 / month',
  DATE_ADD(CURDATE(), INTERVAL 25 DAY),
  'OPEN'
);

-- ── Blog Posts (Real estate / digital marketing focused) ──────────────
INSERT IGNORE INTO `blog_posts` (`id`,`title`,`slug`,`category`,`status`,`excerpt`,`content`,`author`,`created_at`) VALUES
(
  'b001',
  'How to Generate 50+ Real Estate Leads Per Month Using Facebook Ads',
  'generate-real-estate-leads-facebook-ads',
  'Lead Generation',
  'PUBLISHED',
  'Discover the exact Facebook advertising framework our agency uses to generate 50+ qualified real estate leads every month — without wasting budget on the wrong audience.',
  'In 2024, Facebook and Instagram remain the most cost-effective platforms for real estate lead generation in Kenya and across Africa. But most agents are burning their budget on broad audiences with weak creatives. In this guide, we break down the exact framework we use for our clients to consistently generate 50+ qualified leads per month.\n\n## 1. Start with Hyper-Targeted Audiences\n\nThe biggest mistake real estate advertisers make is targeting everyone. Instead, build custom audiences based on:\n- Recent property searches on Facebook\n- People who have visited your website (retargeting with Meta Pixel)\n- Lookalike audiences from your existing client list\n- Interest-based targeting: "Real estate Kenya", "Home ownership", "Property investment"\n\n## 2. Use Lead Generation Ads, Not Traffic Ads\n\nFacebook''s Lead Ads keep users on the platform and pre-fill their contact information. This dramatically reduces friction and lowers your cost per lead. We typically see CPLs 40-60% lower with lead forms versus sending traffic to a landing page.\n\n## 3. The Creative Formula That Converts\n\nYour ad creative needs to answer one question immediately: "Why should I care?" The best performing real estate ads in our portfolio all follow this formula:\n- Hook: A surprising fact or bold claim ("Why 90% of Nairobi renters overpay")\n- Value: What they will learn or get\n- CTA: A clear, low-commitment ask ("Get free property guide")\n\n## 4. Set Up Your Pixel Correctly\n\nThe Facebook Pixel is non-negotiable. Install it on your website and create custom conversion events for:\n- Lead form submissions\n- Phone calls\n- Property enquiry submissions\n- WhatsApp chat initiations\n\n## 5. Test, Optimise, Scale\n\nStart with a small budget (KES 3,000–5,000/week), run 3–4 ad variations, let them run for 7 days, then cut losers and scale winners. Never change a running campaign — let the algorithm learn.\n\n## Result\n\nFollowing this framework, one of our Nairobi-based real estate clients went from 8 leads per month to 63 leads per month within 90 days, at a cost per lead of KES 450.',
  'Misgina Fitwi',
  DATE_SUB(NOW(), INTERVAL 5 DAY)
),
(
  'b002',
  '5 Website Mistakes That Are Costing Your Real Estate Business Leads',
  'website-mistakes-real-estate-business',
  'Web Development',
  'PUBLISHED',
  'Your website might be turning away potential clients without you knowing it. Here are the 5 most common website mistakes we see on real estate sites — and exactly how to fix them.',
  'We audit dozens of real estate websites every year at AdConnect, and the same problems keep showing up. If your website isn''t converting visitors into enquiries, one of these five issues is almost certainly the cause.\n\n## 1. Slow Load Speed\n\nGoogle''s research shows that 53% of mobile users abandon a site that takes more than 3 seconds to load. Real estate websites with lots of property images are particularly vulnerable. Fix: compress all images (use WebP format), enable caching, use a CDN, and minify CSS/JS files. Aim for a Google PageSpeed score of 80+.\n\n## 2. No Clear Call-to-Action\n\nVisitors should never have to guess what to do next. Every page needs one primary CTA that is visible above the fold — no scrolling required. For real estate, this should be "Book a Viewing", "Get Property Alert", or "Speak to an Agent".\n\n## 3. Not Mobile-First\n\nOver 75% of property searches in Kenya happen on mobile devices. If your website isn''t fully responsive and easy to navigate on a 5-inch screen, you are invisible to most of your market. Test your site on actual mobile devices, not just a browser emulator.\n\n## 4. Missing Social Proof\n\nReal estate is a high-trust purchase. Buyers and sellers want evidence that others have had a positive experience with you. Add testimonials, client logos, "properties sold" counters, and Google review widgets prominently on your homepage.\n\n## 5. No Lead Capture Mechanism\n\nMost property searchers are not ready to buy today — they are researching. If you only show a "Contact Us" form, you''ll capture maybe 2% of visitors. Instead, offer a lead magnet: a free neighbourhood guide, a property valuation, or a market report in exchange for an email address. This can 5–10x your lead capture rate.\n\n## Quick Audit Checklist\n\n- [ ] PageSpeed score 80+ on mobile\n- [ ] CTA visible without scrolling on mobile\n- [ ] All images under 150KB\n- [ ] SSL certificate installed (https://)\n- [ ] Testimonials/reviews visible on homepage\n- [ ] Lead magnet or free offer present',
  'Michael Maina',
  DATE_SUB(NOW(), INTERVAL 12 DAY)
),
(
  'b003',
  'The Complete Guide to Real Estate SEO in Kenya (2025)',
  'real-estate-seo-kenya-guide-2025',
  'SEO',
  'PUBLISHED',
  'Search Engine Optimisation for real estate in Kenya is still massively underutilised. Here''s a complete, actionable guide to ranking your property listings and agency on Google''s first page.',
  'Paid ads are powerful, but organic search traffic converts at 3–5x the rate of paid traffic because people are actively looking for what you offer. Here is our complete guide to real estate SEO in Kenya.\n\n## Keyword Research: What Are Buyers Searching For?\n\nStart with these high-intent keyword categories:\n- Location + property type: "2 bedroom apartment Westlands", "houses for sale Karen Nairobi"\n- Buyer intent: "best real estate agents Nairobi", "how to buy land in Kenya"\n- Investment: "real estate investment Kenya 2025", "buy land Kiambu"\n\nUse Google Keyword Planner (free) or Ahrefs to find monthly search volumes.\n\n## On-Page SEO for Property Listings\n\nEach property listing page should have:\n- A descriptive URL: /property/3-bed-apartment-westlands-nairobi\n- A title tag: "3 Bedroom Apartment For Sale in Westlands, Nairobi | AgencyName"\n- A 300+ word unique description (not copy-pasted)\n- Alt text on every image: "3 bedroom apartment living room Westlands Nairobi"\n- Schema markup for real estate listings\n\n## Local SEO: Your Secret Weapon\n\nFor most Kenyan real estate agencies, local SEO will drive more leads than national SEO. Key actions:\n1. Claim and fully complete your Google Business Profile\n2. Get 10+ genuine Google reviews from past clients\n3. Ensure your NAP (Name, Address, Phone) is consistent across all online directories\n4. Create neighbourhood guide pages for every area you serve\n\n## Content Marketing\n\nPublish one blog post per week targeting a specific keyword your audience searches for. Ideas:\n- "Cost of living in Kilimani vs Lavington"\n- "First-time home buyer guide Kenya 2025"\n- "How to verify property ownership in Kenya"\n\n## Technical SEO Checklist\n\n- [ ] HTTPS installed\n- [ ] XML sitemap submitted to Google Search Console\n- [ ] robots.txt configured correctly\n- [ ] No broken links (use Screaming Frog free version)\n- [ ] Mobile-friendly (Google Mobile-Friendly Test)\n- [ ] Page speed 80+ (Google PageSpeed Insights)',
  'AdConnect Team',
  DATE_SUB(NOW(), INTERVAL 20 DAY)
),
(
  'b004',
  'Why Your Real Estate Facebook Ads Are Failing (And How to Fix It)',
  'why-real-estate-facebook-ads-failing',
  'Social Media',
  'PUBLISHED',
  'Running Facebook ads that burn money with no results? You''re not alone. These are the exact reasons most real estate Facebook campaigns fail — and the fixes that turn them around.',
  'We take over failed Facebook ad campaigns every week. And almost every time, the problems fall into the same categories. Here''s what''s killing your campaign performance and what to do instead.\n\n## Problem 1: Audience Too Broad\n\nTargeting "all of Kenya, ages 25–55, interested in real estate" sounds logical but it''s actually terrible. You''re competing with every other real estate advertiser for the same generic audience at high CPMs.\n\n**Fix:** Layer your targeting. Start with location (specific neighbourhood or estate), then add behavioural signals (homeowners, people who have recently moved, frequent travellers), then interest layers. Your audience size should be between 100,000–500,000 for most Kenyan campaigns.\n\n## Problem 2: Weak Ad Creative\n\nScrolling through Facebook takes 1.7 seconds per post. If your ad doesn''t stop the thumb in that window, it failed before the headline was read.\n\n**Fix:** Use video over static images (3–5x higher engagement). The first 3 seconds must show the property''s most impressive feature. Add captions — 85% of Facebook videos are watched without sound.\n\n## Problem 3: Sending Traffic to a Weak Landing Page\n\nYou''ve written a great ad, someone clicks — and they arrive at your generic "Contact Us" page. Of course they bounce.\n\n**Fix:** Every ad should go to a dedicated landing page that matches the ad''s message exactly (message match). The landing page should have one goal, one CTA, and load in under 3 seconds.\n\n## Problem 4: Not Retargeting\n\n97% of website visitors don''t convert on the first visit. If you''re not retargeting them with Facebook ads, you''re leaving enormous money on the table.\n\n**Fix:** Install the Meta Pixel, create a custom audience of website visitors from the last 30 days, and run retargeting ads with a testimonial, a property showcase, or a time-sensitive offer.\n\n## Problem 5: Turning Campaigns Off Too Early\n\nFacebook''s algorithm needs time to learn. If you turn off an ad set after 3 days because it isn''t performing, you''ve wasted your budget and given up before the optimisation started.\n\n**Fix:** Let campaigns run for a minimum of 7 days before making significant changes. Judge performance on cost per lead or cost per appointment, not cost per click.',
  'Misgina Fitwi',
  DATE_SUB(NOW(), INTERVAL 28 DAY)
),
(
  'b005',
  'Android App Development for Real Estate: What You Need to Know Before You Build',
  'android-app-development-real-estate-kenya',
  'Technology',
  'PUBLISHED',
  'Thinking of building a mobile app for your real estate business? Here''s everything you need to know before writing a single line of code — from features to cost to timeline.',
  'The question we get asked most often by real estate clients: "Should I build an app?" The honest answer: it depends. Here''s our complete guide to help you decide and plan effectively.\n\n## Do You Actually Need a Mobile App?\n\nBefore investing KES 200,000–500,000 in app development, ask yourself:\n- Do you have an existing website that performs well on mobile? (If not, fix that first)\n- Does your use case truly require native phone features (GPS, camera, notifications)?\n- Do you have 1,000+ monthly active users who would use the app regularly?\n\nIf you answered yes to all three, an app likely makes sense. If not, a well-optimised Progressive Web App (PWA) may give you 80% of the benefit at 20% of the cost.\n\n## Essential Features for a Real Estate App\n\n**Must-Have:**\n- Property search with filters (location, price, bedrooms, type)\n- High-quality image galleries\n- Map view with property pins\n- Agent contact (call, WhatsApp, email)\n- Save/favourite properties\n- Push notifications for new listings\n\n**Nice-to-Have:**\n- Virtual tours (360° or video)\n- Mortgage calculator\n- Neighbourhood info (schools, hospitals, transport)\n- Document management for offers/leases\n\n**Advanced (Phase 2):**\n- AI-powered property recommendations\n- In-app messaging between buyer and agent\n- Digital signature for offer letters\n- Property valuation estimates\n\n## Technology Stack We Recommend\n\nFor most Kenyan real estate apps, we recommend:\n- **Native Android:** Kotlin with Jetpack Compose (best performance, access to all device features)\n- **Backend:** Node.js + MySQL (fast, scalable, cost-effective)\n- **Maps:** Google Maps SDK\n- **Authentication:** Firebase Auth\n- **Push Notifications:** Firebase Cloud Messaging (FCM)\n\n## Realistic Timeline and Cost\n\n- Design (Figma wireframes + UI): 3–4 weeks\n- Android development (MVP): 8–12 weeks\n- Testing and QA: 2–3 weeks\n- Google Play Store submission: 1–2 weeks\n- **Total time to launch: 4–5 months**\n- **Cost range: KES 250,000 – 600,000** depending on features\n\n## Common Mistakes to Avoid\n\n1. Building too many features before validating the concept\n2. Skipping the design phase and going straight to code\n3. Underestimating ongoing maintenance costs (budget 20% of build cost per year)\n4. Not planning for Play Store compliance from day one',
  'Michael Maina',
  DATE_SUB(NOW(), INTERVAL 35 DAY)
),
(
  'b006',
  'How to Build a Personal Brand as a Real Estate Agent in Kenya',
  'personal-brand-real-estate-agent-kenya',
  'Branding',
  'PUBLISHED',
  'In a crowded market, your personal brand is your biggest differentiator. Here''s a practical guide to building a recognisable, trustworthy personal brand as a real estate agent in Kenya.',
  'Buyers and sellers don''t just choose an agency — they choose a person they trust. Building a strong personal brand means more referrals, higher-quality clients, and the ability to charge premium fees. Here''s how to build one deliberately.\n\n## Step 1: Define Your Niche\n\nThe biggest branding mistake agents make is trying to be everything to everyone. The most successful agents we work with have a clear niche:\n- "The Westlands Apartment Specialist"\n- "Luxury Karen & Runda Properties"\n- "First-Time Buyer Guide — Affordable Nairobi Housing"\n\nYour niche doesn''t limit you — it makes you the obvious choice for your ideal client.\n\n## Step 2: Establish Your Signature Story\n\nPeople remember stories, not CVs. Craft a 2–3 sentence personal story that answers:\n- Why did you get into real estate?\n- Who do you specifically help?\n- What makes your approach different?\n\nThis story should be consistent across your LinkedIn profile, Instagram bio, website about page, and when you introduce yourself at events.\n\n## Step 3: Choose Your Primary Content Platform\n\nYou cannot be everywhere at once. Choose one primary platform and be excellent at it:\n- **Instagram/TikTok:** Best for lifestyle content, property tours, behind-the-scenes\n- **LinkedIn:** Best for professional network, investor audience, corporate relocations\n- **YouTube:** Best for in-depth neighbourhood guides and property walkthroughs\n- **Facebook:** Best for older demographic, community groups, paid ads support\n\nPost 3–5 times per week consistently for 6 months before expecting significant results.\n\n## Step 4: Content Formula for Real Estate Agents\n\nFor every 10 pieces of content:\n- 4 educational (market insights, buying/selling tips, neighbourhood guides)\n- 3 social proof (client testimonials, sold properties, success stories)\n- 2 behind-the-scenes (your process, your day, team culture)\n- 1 promotional (your services, available properties)\n\n## Step 5: Collect and Display Social Proof Aggressively\n\nAfter every successful transaction, ask your client for:\n- A Google review (5 stars)\n- A short video testimonial (30–60 seconds on their phone)\n- A written quote you can use on social media\n\nDisplay these everywhere: your website, social media profiles, email signature, and WhatsApp business profile.\n\n## Step 6: Network Strategically\n\nAttend 1–2 networking events per month in your target market segment. Follow up within 24 hours via LinkedIn or WhatsApp. Give before you ask — share useful market information, make introductions, refer business.\n\nBuilding a personal brand takes 12–18 months of consistent effort. But the agents who do it become the names everyone in their niche knows — and they never need to cold-call again.',
  'Misgina Fitwi',
  DATE_SUB(NOW(), INTERVAL 42 DAY)
);

-- Career Listings (for the "Careers" page and admin management)
INSERT IGNORE INTO career_listings (id,title,department,type,location,mode,salary,description,tags,status) VALUES
('j001','Digital Marketing Specialist','Marketing','Full-time','Nairobi','Hybrid','KES 80,000 – 120,000/mo',
 'Drive high-ROI Facebook and Google campaigns for real estate clients.',
 JSON_ARRAY('New','Urgent'),'OPEN'),
('j002','Full-Stack Web Developer','Engineering','Full-time','Nairobi','Remote','KES 90,000 – 150,000/mo',
 'Build and maintain client websites and the AdConnect platform.',
 JSON_ARRAY('New'),'OPEN');

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id         VARCHAR(20)  PRIMARY KEY,
  question   TEXT         NOT NULL,
  answer     TEXT         NOT NULL,
  category   VARCHAR(100),
  status     ENUM('PUBLISHED','DRAFT') DEFAULT 'PUBLISHED',
  sort_order INT          DEFAULT 0,
  featured   TINYINT(1)   DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME,
  INDEX idx_status   (status),
  INDEX idx_category (category)
);
 
-- FAQ Submissions (from public form)
CREATE TABLE IF NOT EXISTS faq_submissions (
  id         VARCHAR(20) PRIMARY KEY,
  name       VARCHAR(100),
  email      VARCHAR(255),
  question   TEXT NOT NULL,
  created_at DATETIME
);
 
-- Media Library
CREATE TABLE IF NOT EXISTS media_library (
  id            VARCHAR(20)  PRIMARY KEY,
  filename      VARCHAR(300) NOT NULL,
  original_name VARCHAR(300),
  type          VARCHAR(50)  DEFAULT 'general',
  alt           VARCHAR(500),
  tags          JSON,
  size          INT,
  width         INT,
  height        INT,
  mime_type     VARCHAR(100),
  created_at    DATETIME,
  INDEX idx_type (type)
);
 
-- Site Analytics
CREATE TABLE IF NOT EXISTS site_analytics (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  date       DATE         NOT NULL,
  page       VARCHAR(500),
  ip_hash    VARCHAR(64),
  referrer   VARCHAR(500),
  visits     INT          DEFAULT 1,
  created_at DATETIME,
  updated_at DATETIME,
  INDEX idx_date (date),
  INDEX idx_ip   (ip_hash)
);
 
-- Newsletter
CREATE TABLE IF NOT EXISTS newsletter (
  id         VARCHAR(20)  PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  status     ENUM('ACTIVE','UNSUBSCRIBED') DEFAULT 'ACTIVE',
  created_at DATETIME
);
 
-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id           VARCHAR(20)  PRIMARY KEY,
  full_name    VARCHAR(200) NOT NULL,
  email        VARCHAR(255),
  phone        VARCHAR(30),
  company_role VARCHAR(200),
  department   VARCHAR(100),
  user_role    VARCHAR(50),
  bio          TEXT,
  linkedin     VARCHAR(500),
  photo        VARCHAR(300),
  is_active    TINYINT(1) DEFAULT 1,
  created_at   DATETIME,
  updated_at   DATETIME,
  INDEX idx_active (is_active)
);
 
-- Seed sample FAQs
INSERT IGNORE INTO faqs (id, question, answer, category, status, sort_order, featured) VALUES
('fq001', 'How long does it take to see results from Facebook Ads?', 'Most clients start seeing measurable results within 2–4 weeks of launching their campaigns. The first week is typically used for audience learning and optimization.', 'Advertising', 'PUBLISHED', 1, 1),
('fq002', 'What is your minimum advertising budget?', 'We recommend a minimum monthly budget of KES 30,000 for advertising spend. This ensures enough data for the algorithms to optimize effectively.', 'Pricing', 'PUBLISHED', 2, 1),
('fq003', 'Do you work with real estate companies outside Kenya?', 'Yes! We work with real estate businesses across East Africa and beyond. All consultations can be conducted online.', 'General', 'PUBLISHED', 3, 0),
('fq004', 'Can you build a website for my real estate company?', 'Absolutely. Our development team builds modern, fast, and conversion-focused websites for real estate businesses using the latest technologies.', 'Services', 'PUBLISHED', 4, 0);


-- Email Sequence Queue
CREATE TABLE IF NOT EXISTS email_sequence_queue (
  id           VARCHAR(20)  PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  sequence_day INT          NOT NULL,
  subject      VARCHAR(500),
  category     VARCHAR(50),
  scheduled_at DATETIME     NOT NULL,
  sent_at      DATETIME,
  status       ENUM('PENDING','SENT','FAILED','PAUSED','SKIPPED','SKIPPED_PREF','CANCELLED') DEFAULT 'PENDING',
  retry_count  INT DEFAULT 0,
  created_at   DATETIME,
  UNIQUE KEY uq_email_day (email, sequence_day),
  INDEX idx_status_sched (status, scheduled_at),
  INDEX idx_email (email)
);
 
-- Email Preferences
CREATE TABLE IF NOT EXISTS email_preferences (
  id          VARCHAR(20)  PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  preferences JSON,
  updated_at  DATETIME,
  INDEX idx_email (email)
);
 
-- Unsubscribe Log
CREATE TABLE IF NOT EXISTS unsubscribe_log (
  id         VARCHAR(20)  PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  reason     VARCHAR(100),
  created_at DATETIME,
  INDEX idx_email (email)
);
-- ════════════════════════════════════════════════════════════════════════
-- 4. CLEANUP
-- ════════════════════════════════════════════════════════════════════════

SELECT CONCAT('✅ AdConnect database setup complete. Tables created: ',
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()),
  '. Ready to use.') AS status;