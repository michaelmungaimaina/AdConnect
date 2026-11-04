-- ════════════════════════════════════════════════════════════════════════
-- AdConnect — database schema (MySQL 5.7+ / MariaDB 10.3+)
--
-- • Import this file ONCE into the (already created) database, e.g. with
--   phpMyAdmin → Import. It contains no CREATE DATABASE / USE statements, so it
--   works with cPanel databases that carry an account prefix.
-- • Every statement is idempotent (CREATE TABLE IF NOT EXISTS). The Node server also
--   runs this file on start-up, so upgrades never need manual SQL.
-- • Sample content lives in database/sample-data.sql (optional).
-- ════════════════════════════════════════════════════════════════════════

-- ── Staff users (admin panel) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`           VARCHAR(20)  NOT NULL,
  `name`         VARCHAR(150) NOT NULL,
  `email`        VARCHAR(200) NOT NULL,
  `password`     VARCHAR(255) NOT NULL,
  `role`         VARCHAR(30)  NOT NULL DEFAULT 'GEN_USER',
  `access_level` VARCHAR(10)  NOT NULL DEFAULT '0R00',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Clients / leads (CRM) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `clients` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `clientID`           VARCHAR(20)  NOT NULL,
  `clientName`         VARCHAR(200) NOT NULL,
  `clientEmail`        VARCHAR(200) NOT NULL,
  `clientPhone`        VARCHAR(30)  NOT NULL,
  `clientCity`         VARCHAR(150) DEFAULT NULL,
  `clientCompany`      VARCHAR(200) DEFAULT NULL,
  `clientStreet`       VARCHAR(200) DEFAULT NULL,
  `clientProvince`     VARCHAR(100) DEFAULT NULL,
  `clientZip`          VARCHAR(20)  DEFAULT NULL,
  `clientSource`       VARCHAR(100) DEFAULT 'Direct',
  `clientStatus`       VARCHAR(50)  DEFAULT '1ST CONTACT',
  `clientSubScription` VARCHAR(30)  DEFAULT 'SUBSCRIBED',
  `created_at`         DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clients_clientID` (`clientID`),
  KEY `idx_clients_email` (`clientEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Marketing strategy applications (multi-step form on the home page) ─
CREATE TABLE IF NOT EXISTS `marketing_strategy` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `applicationDate`    VARCHAR(20)  NOT NULL,
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
  `updated_at`         DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_marketing_applicationDate` (`applicationDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── About / team profile cards ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `about` (
  `id`           VARCHAR(20)  NOT NULL,
  `title`        VARCHAR(300) NOT NULL,
  `introduction` TEXT         DEFAULT NULL,
  `experience`   TEXT         DEFAULT NULL,
  `mission`      TEXT         DEFAULT NULL,
  `status`       VARCHAR(20)  DEFAULT 'INACTIVE',
  `icon`         VARCHAR(500) DEFAULT NULL,
  `updated_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Home page video ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `video` (
  `id`         VARCHAR(20)  NOT NULL,
  `title`      VARCHAR(300) NOT NULL,
  `created_by` VARCHAR(150) DEFAULT NULL,
  `video`      VARCHAR(500) DEFAULT NULL,
  `status`     VARCHAR(20)  DEFAULT 'INACTIVE',
  `created_on` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Manual follow-up templates per lead status (Leads panel) ──────────
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `status`     VARCHAR(50)  NOT NULL,
  `subject`    VARCHAR(300) NOT NULL,
  `body`       LONGTEXT     NOT NULL,
  `updated_at` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email_templates_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Blog ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id`          VARCHAR(20)  NOT NULL,
  `title`       VARCHAR(400) NOT NULL,
  `slug`        VARCHAR(400) DEFAULT NULL,
  `category`    VARCHAR(100) DEFAULT 'General',
  `status`      VARCHAR(20)  DEFAULT 'DRAFT',
  `excerpt`     TEXT         DEFAULT NULL,
  `content`     LONGTEXT     DEFAULT NULL,
  `author`      VARCHAR(150) DEFAULT 'AdConnect Team',
  `cover_image` VARCHAR(500) DEFAULT NULL,
  `view_count`  INT          DEFAULT 0,
  `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_blog_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Portfolio ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `projects` (
  `id`          VARCHAR(20)  NOT NULL,
  `name`        VARCHAR(300) NOT NULL,
  `type`        VARCHAR(60)  DEFAULT 'Website',
  `description` TEXT         NOT NULL,
  `tags`        TEXT         DEFAULT NULL,
  `url`         VARCHAR(500) DEFAULT NULL,
  `thumbnail`   VARCHAR(500) DEFAULT NULL,
  `status`      VARCHAR(20)  DEFAULT 'ACTIVE',
  `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
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
  `status`        VARCHAR(20)  DEFAULT 'ACTIVE',
  `display_order` INT          DEFAULT 0,
  `created_at`    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Site settings (home page copy, global contact details, booking rules, theme) ─
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `section`       VARCHAR(80)  NOT NULL DEFAULT 'homepage',
  `setting_key`   VARCHAR(100) NOT NULL,
  `setting_value` TEXT         DEFAULT NULL,
  `updated_at`    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_section_key` (`section`, `setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Contact form messages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `messageId`  VARCHAR(20)  NOT NULL,
  `name`       VARCHAR(200) NOT NULL,
  `email`      VARCHAR(200) NOT NULL,
  `phone`      VARCHAR(30)  DEFAULT NULL,
  `subject`    VARCHAR(250) DEFAULT NULL,
  `message`    TEXT         NOT NULL,
  `status`     VARCHAR(20)  DEFAULT 'UNREAD',
  `reply_text` TEXT         DEFAULT NULL,
  `replied_at` DATETIME     DEFAULT NULL,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_contact_messageId` (`messageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Careers ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `career_listings` (
  `id`           VARCHAR(20)  NOT NULL,
  `title`        VARCHAR(255) NOT NULL,
  `department`   VARCHAR(100) NOT NULL,
  `type`         VARCHAR(30)  DEFAULT 'Full-time',
  `location`     VARCHAR(150) DEFAULT 'Nairobi',
  `mode`         VARCHAR(20)  DEFAULT 'On-site',
  `salary`       VARCHAR(100) DEFAULT NULL,
  `description`  TEXT         NOT NULL,
  `requirements` TEXT         DEFAULT NULL,
  `deadline`     DATE         DEFAULT NULL,
  `status`       VARCHAR(20)  DEFAULT 'OPEN',
  `pinned`       TINYINT      DEFAULT 0,
  `tags`         TEXT         DEFAULT NULL,
  `created_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_career_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `career_applications` (
  `id`              VARCHAR(20)  NOT NULL,
  `job_id`          VARCHAR(20)  NOT NULL,
  `job_title`       VARCHAR(255) DEFAULT NULL,
  `job_department`  VARCHAR(100) DEFAULT NULL,
  `first_name`      VARCHAR(100) NOT NULL,
  `last_name`       VARCHAR(100) NOT NULL,
  `email`           VARCHAR(255) NOT NULL,
  `phone`           VARCHAR(30)  DEFAULT NULL,
  `current_role`    VARCHAR(200) DEFAULT NULL,
  `experience`      VARCHAR(50)  DEFAULT NULL,
  `motivation`      TEXT         DEFAULT NULL,
  `portfolio`       VARCHAR(500) DEFAULT NULL,
  `cv_filename`     VARCHAR(300) DEFAULT NULL,
  `status`          VARCHAR(20)  DEFAULT 'PENDING',
  `admin_notes`     TEXT         DEFAULT NULL,
  `interview_date`  VARCHAR(60)  DEFAULT NULL,
  `interview_notes` TEXT         DEFAULT NULL,
  `created_at`      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_capp_job` (`job_id`),
  KEY `idx_capp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Analytics ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `page_views` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `page_name`    VARCHAR(255) NOT NULL,
  `page_path`    VARCHAR(255) DEFAULT NULL,
  `session_id`   VARCHAR(100) DEFAULT NULL,
  `ip_address`   VARCHAR(64)  DEFAULT NULL,
  `user_agent`   TEXT         DEFAULT NULL,
  `referrer`     TEXT         DEFAULT NULL,
  `utm_source`   VARCHAR(100) DEFAULT NULL,
  `utm_medium`   VARCHAR(100) DEFAULT NULL,
  `utm_campaign` VARCHAR(100) DEFAULT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pv_created` (`created_at`),
  KEY `idx_pv_page` (`page_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `site_analytics` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `date`       DATE         NOT NULL,
  `page`       VARCHAR(255) DEFAULT NULL,
  `ip_hash`    VARCHAR(64)  DEFAULT NULL,
  `referrer`   VARCHAR(255) DEFAULT NULL,
  `visits`     INT          DEFAULT 1,
  `created_at` DATETIME     DEFAULT NULL,
  `updated_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sa_day_page_ip` (`date`, `page`, `ip_hash`),
  KEY `idx_sa_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── FAQs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `faqs` (
  `id`         VARCHAR(20)  NOT NULL,
  `question`   TEXT         NOT NULL,
  `answer`     TEXT         NOT NULL,
  `category`   VARCHAR(100) DEFAULT NULL,
  `status`     VARCHAR(20)  DEFAULT 'PUBLISHED',
  `sort_order` INT          DEFAULT 0,
  `featured`   TINYINT(1)   DEFAULT 0,
  `created_at` DATETIME     DEFAULT NULL,
  `updated_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_faq_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `faq_submissions` (
  `id`         VARCHAR(20)  NOT NULL,
  `name`       VARCHAR(100) DEFAULT NULL,
  `email`      VARCHAR(255) DEFAULT NULL,
  `question`   TEXT         NOT NULL,
  `created_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Media library ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `media_library` (
  `id`            VARCHAR(20)  NOT NULL,
  `filename`      VARCHAR(300) NOT NULL,
  `original_name` VARCHAR(300) DEFAULT NULL,
  `type`          VARCHAR(50)  DEFAULT 'general',
  `alt`           VARCHAR(500) DEFAULT NULL,
  `tags`          TEXT         DEFAULT NULL,
  `size`          INT          DEFAULT NULL,
  `width`         INT          DEFAULT NULL,
  `height`        INT          DEFAULT NULL,
  `mime_type`     VARCHAR(100) DEFAULT NULL,
  `created_at`    DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_media_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Team members (admin → Users → Team) ───────────────────────────────
CREATE TABLE IF NOT EXISTS `team_members` (
  `id`           VARCHAR(20)  NOT NULL,
  `full_name`    VARCHAR(200) NOT NULL,
  `email`        VARCHAR(255) DEFAULT NULL,
  `phone`        VARCHAR(30)  DEFAULT NULL,
  `company_role` VARCHAR(200) DEFAULT NULL,
  `department`   VARCHAR(100) DEFAULT NULL,
  `user_role`    VARCHAR(50)  DEFAULT NULL,
  `bio`          TEXT         DEFAULT NULL,
  `linkedin`     VARCHAR(500) DEFAULT NULL,
  `photo`        VARCHAR(300) DEFAULT NULL,
  `is_active`    TINYINT(1)   DEFAULT 1,
  `created_at`   DATETIME     DEFAULT NULL,
  `updated_at`   DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ════════════════════════════════════════════════════════════════════════
-- NEW — service catalogue, bookings, proposals, subscribers, campaigns
-- ════════════════════════════════════════════════════════════════════════

-- ── Service categories (Digital Marketing, Web Development, …) ────────
CREATE TABLE IF NOT EXISTS `service_categories` (
  `id`              VARCHAR(20)  NOT NULL,
  `slug`            VARCHAR(80)  NOT NULL,
  `name`            VARCHAR(150) NOT NULL,
  `tagline`         VARCHAR(300) DEFAULT NULL,
  `description`     TEXT         DEFAULT NULL,
  `icon`            VARCHAR(60)  DEFAULT 'fa-star',
  `sort_order`      INT          NOT NULL DEFAULT 0,
  `status`          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  `allow_booking`   TINYINT(1)   NOT NULL DEFAULT 1,
  `allow_proposal`  TINYINT(1)   NOT NULL DEFAULT 1,
  `session_minutes` INT          NOT NULL DEFAULT 30,
  `host_key`        VARCHAR(40)  NOT NULL DEFAULT 'team',
  `host_name`       VARCHAR(120) DEFAULT NULL,
  `created_at`      DATETIME     DEFAULT NULL,
  `updated_at`      DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cat_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Individual services inside a category ─────────────────────────────
CREATE TABLE IF NOT EXISTS `services` (
  `id`             VARCHAR(20)  NOT NULL,
  `category_id`    VARCHAR(20)  NOT NULL,
  `slug`           VARCHAR(100) NOT NULL,
  `name`           VARCHAR(200) NOT NULL,
  `summary`        VARCHAR(500) DEFAULT NULL,
  `description`    TEXT         DEFAULT NULL,
  `features`       TEXT         DEFAULT NULL,
  `icon`           VARCHAR(60)  DEFAULT 'fa-check',
  `starting_price` VARCHAR(100) DEFAULT NULL,
  `delivery_time`  VARCHAR(100) DEFAULT NULL,
  `sort_order`     INT          NOT NULL DEFAULT 0,
  `featured`       TINYINT(1)   NOT NULL DEFAULT 0,
  `status`         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  `created_at`     DATETIME     DEFAULT NULL,
  `updated_at`     DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_service_slug` (`slug`),
  KEY `idx_service_cat` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Bookings (consultation sessions, per category) ────────────────────
CREATE TABLE IF NOT EXISTS `bookings` (
  `id`             VARCHAR(20)  NOT NULL,
  `reference`      VARCHAR(20)  NOT NULL,
  `category_id`    VARCHAR(20)  DEFAULT NULL,
  `category_slug`  VARCHAR(80)  DEFAULT NULL,
  `category_name`  VARCHAR(150) DEFAULT NULL,
  `service_id`     VARCHAR(20)  DEFAULT NULL,
  `service_name`   VARCHAR(200) DEFAULT NULL,
  `name`           VARCHAR(200) NOT NULL,
  `email`          VARCHAR(200) NOT NULL,
  `phone`          VARCHAR(40)  DEFAULT NULL,
  `company`        VARCHAR(200) DEFAULT NULL,
  `session_mode`   VARCHAR(20)  NOT NULL DEFAULT 'ONLINE',
  `booking_date`   DATE         NOT NULL,
  `start_time`     VARCHAR(5)   NOT NULL,
  `end_time`       VARCHAR(5)   DEFAULT NULL,
  `host_key`       VARCHAR(40)  DEFAULT 'team',
  `host_name`      VARCHAR(120) DEFAULT NULL,
  `topic`          TEXT         DEFAULT NULL,
  `status`         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  `meeting_link`   VARCHAR(500) DEFAULT NULL,
  `location`       VARCHAR(250) DEFAULT NULL,
  `admin_notes`    TEXT         DEFAULT NULL,
  `slot_key`       VARCHAR(70)  DEFAULT NULL,
  `reminder_sent`  TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`     DATETIME     DEFAULT NULL,
  `updated_at`     DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_booking_ref` (`reference`),
  UNIQUE KEY `uq_booking_slot` (`slot_key`),
  KEY `idx_booking_date` (`booking_date`),
  KEY `idx_booking_status` (`status`),
  KEY `idx_booking_cat` (`category_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Project proposals uploaded by clients ─────────────────────────────
CREATE TABLE IF NOT EXISTS `proposals` (
  `id`            VARCHAR(20)  NOT NULL,
  `reference`     VARCHAR(20)  NOT NULL,
  `category_id`   VARCHAR(20)  DEFAULT NULL,
  `category_slug` VARCHAR(80)  DEFAULT NULL,
  `category_name` VARCHAR(150) DEFAULT NULL,
  `service_id`    VARCHAR(20)  DEFAULT NULL,
  `service_name`  VARCHAR(200) DEFAULT NULL,
  `name`          VARCHAR(200) NOT NULL,
  `email`         VARCHAR(200) NOT NULL,
  `phone`         VARCHAR(40)  DEFAULT NULL,
  `company`       VARCHAR(200) DEFAULT NULL,
  `title`         VARCHAR(250) NOT NULL,
  `summary`       TEXT         DEFAULT NULL,
  `budget_range`  VARCHAR(100) DEFAULT NULL,
  `timeline`      VARCHAR(100) DEFAULT NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'NEW',
  `quote_amount`  VARCHAR(100) DEFAULT NULL,
  `admin_notes`   TEXT         DEFAULT NULL,
  `created_at`    DATETIME     DEFAULT NULL,
  `updated_at`    DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proposal_ref` (`reference`),
  KEY `idx_proposal_status` (`status`),
  KEY `idx_proposal_cat` (`category_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `proposal_files` (
  `id`            VARCHAR(20)  NOT NULL,
  `proposal_id`   VARCHAR(20)  NOT NULL,
  `original_name` VARCHAR(300) NOT NULL,
  `stored_name`   VARCHAR(300) NOT NULL,
  `size`          INT          DEFAULT 0,
  `mime`          VARCHAR(120) DEFAULT NULL,
  `created_at`    DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pfile_proposal` (`proposal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `proposal_replies` (
  `id`          VARCHAR(20)  NOT NULL,
  `proposal_id` VARCHAR(20)  NOT NULL,
  `subject`     VARCHAR(300) DEFAULT NULL,
  `body`        TEXT         NOT NULL,
  `sent_by`     VARCHAR(150) DEFAULT NULL,
  `email_ok`    TINYINT(1)   DEFAULT 1,
  `created_at`  DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_preply_proposal` (`proposal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── E-mail subscribers (newsletter + drip campaign) ───────────────────
CREATE TABLE IF NOT EXISTS `subscribers` (
  `id`                  VARCHAR(20)  NOT NULL,
  `email`               VARCHAR(200) NOT NULL,
  `name`                VARCHAR(200) DEFAULT NULL,
  `phone`               VARCHAR(40)  DEFAULT NULL,
  `interests`           TEXT         DEFAULT NULL,
  `status`              VARCHAR(20)  NOT NULL DEFAULT 'SUBSCRIBED',
  `source`              VARCHAR(60)  DEFAULT 'website',
  `current_step`        INT          NOT NULL DEFAULT -1,
  `next_send_at`        DATETIME     DEFAULT NULL,
  `last_sent_at`        DATETIME     DEFAULT NULL,
  `subscribed_at`       DATETIME     DEFAULT NULL,
  `unsubscribed_at`     DATETIME     DEFAULT NULL,
  `unsubscribe_reason`  VARCHAR(200) DEFAULT NULL,
  `notes`               TEXT         DEFAULT NULL,
  `created_at`          DATETIME     DEFAULT NULL,
  `updated_at`          DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sub_email` (`email`),
  KEY `idx_sub_status_next` (`status`, `next_send_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Drip campaign: welcome (step 0) + follow-ups (steps 1…n) ──────────
CREATE TABLE IF NOT EXISTS `email_campaign_steps` (
  `id`         VARCHAR(20)  NOT NULL,
  `step`       INT          NOT NULL,
  `day_offset` INT          NOT NULL DEFAULT 0,
  `category`   VARCHAR(40)  DEFAULT 'general',
  `subject`    VARCHAR(300) NOT NULL,
  `preheader`  VARCHAR(250) DEFAULT NULL,
  `kicker`     VARCHAR(80)  DEFAULT NULL,
  `title`      VARCHAR(250) NOT NULL,
  `body_html`  MEDIUMTEXT   NOT NULL,
  `cta_text`   VARCHAR(80)  DEFAULT NULL,
  `cta_url`    VARCHAR(500) DEFAULT NULL,
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME     DEFAULT NULL,
  `updated_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_campaign_step` (`step`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── One-off broadcasts written in the admin panel ─────────────────────
CREATE TABLE IF NOT EXISTS `broadcasts` (
  `id`         VARCHAR(20)  NOT NULL,
  `subject`    VARCHAR(300) NOT NULL,
  `preheader`  VARCHAR(250) DEFAULT NULL,
  `title`      VARCHAR(250) DEFAULT NULL,
  `body_html`  MEDIUMTEXT   NOT NULL,
  `cta_text`   VARCHAR(80)  DEFAULT NULL,
  `cta_url`    VARCHAR(500) DEFAULT NULL,
  `audience`   VARCHAR(80)  NOT NULL DEFAULT 'ALL',
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `recipients` INT          DEFAULT 0,
  `sent_count` INT          DEFAULT 0,
  `failed_count` INT        DEFAULT 0,
  `created_by` VARCHAR(150) DEFAULT NULL,
  `sent_at`    DATETIME     DEFAULT NULL,
  `created_at` DATETIME     DEFAULT NULL,
  `updated_at` DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Every e-mail the campaign engine sends ────────────────────────────
CREATE TABLE IF NOT EXISTS `email_log` (
  `id`            VARCHAR(20)  NOT NULL,
  `email`         VARCHAR(200) NOT NULL,
  `kind`          VARCHAR(20)  NOT NULL DEFAULT 'CAMPAIGN',
  `step`          INT          DEFAULT NULL,
  `broadcast_id`  VARCHAR(20)  DEFAULT NULL,
  `subject`       VARCHAR(300) DEFAULT NULL,
  `status`        VARCHAR(20)  NOT NULL DEFAULT 'SENT',
  `error`         VARCHAR(500) DEFAULT NULL,
  `created_at`    DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_elog_email` (`email`),
  KEY `idx_elog_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
