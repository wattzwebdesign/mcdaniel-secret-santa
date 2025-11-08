-- Secret Santa Database Schema
-- MySQL 8.0+

-- Drop tables in reverse order of dependencies (if recreating)
DROP TABLE IF EXISTS wish_list_purchases;
DROP TABLE IF EXISTS wish_list_items;
DROP TABLE IF EXISTS sms_queue;
DROP TABLE IF EXISTS sms_logs;
DROP TABLE IF EXISTS exclusion_rules;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS admin_config;
DROP TABLE IF EXISTS participants;

-- Participants Table
CREATE TABLE participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    phone_last_four VARCHAR(4) NOT NULL,
    assigned_to_id INT NULL,
    has_picked BOOLEAN DEFAULT FALSE,
    picked_at DATETIME NULL,

    -- SMS Notification Preferences
    sms_enabled BOOLEAN DEFAULT TRUE,
    notify_on_assignment BOOLEAN DEFAULT TRUE,
    notify_on_wishlist_update BOOLEAN DEFAULT TRUE,
    notify_on_game_start BOOLEAN DEFAULT TRUE,
    notify_reminders BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_phone (phone_number),
    UNIQUE KEY unique_participant (first_name, phone_last_four),
    INDEX idx_phone_last_four (phone_last_four),
    INDEX idx_assigned_to (assigned_to_id),
    INDEX idx_has_picked (has_picked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key after table creation to avoid circular dependency
ALTER TABLE participants
    ADD CONSTRAINT fk_assigned_to
    FOREIGN KEY (assigned_to_id) REFERENCES participants(id) ON DELETE SET NULL;

-- Exclusion Rules Table
CREATE TABLE exclusion_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    excluded_participant_id INT NOT NULL,
    reason VARCHAR(255) NULL COMMENT 'e.g., spouse, sibling, parent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (excluded_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_exclusion (participant_id, excluded_participant_id),
    INDEX idx_participant (participant_id),
    INDEX idx_excluded (excluded_participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wish List Items Table
CREATE TABLE wish_list_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    link VARCHAR(500) NULL COMMENT 'URL to product page',
    price_range VARCHAR(50) NULL COMMENT 'e.g., $20-30',
    priority INT DEFAULT 2 COMMENT '1=must have, 2=would like, 3=if budget allows',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    INDEX idx_participant (participant_id),
    INDEX idx_priority (priority),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wish List Purchases Table
CREATE TABLE wish_list_purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    wish_list_item_id INT NOT NULL,
    santa_participant_id INT NOT NULL,
    marked_purchased BOOLEAN DEFAULT TRUE,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wish_list_item_id) REFERENCES wish_list_items(id) ON DELETE CASCADE,
    FOREIGN KEY (santa_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_purchase_mark (wish_list_item_id, santa_participant_id),
    INDEX idx_wish_list_item (wish_list_item_id),
    INDEX idx_santa (santa_participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SMS Logs Table
CREATE TABLE sms_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    message_type VARCHAR(50) NOT NULL COMMENT 'assignment, wishlist_update, reminder, game_start',
    message_body TEXT NOT NULL,
    twilio_sid VARCHAR(100) NULL COMMENT 'Twilio message SID',
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, sent, delivered, failed, undelivered',
    error_message TEXT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    INDEX idx_participant (participant_id),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_message_type (message_type),
    INDEX idx_twilio_sid (twilio_sid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SMS Queue Table
CREATE TABLE sms_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    priority INT DEFAULT 5 COMMENT '1=highest, 10=lowest',
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    INDEX idx_processed (processed, scheduled_for),
    INDEX idx_priority (priority, scheduled_for),
    INDEX idx_participant (participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Config Table
CREATE TABLE admin_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions Table (for express-mysql-session)
CREATE TABLE sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT,
    INDEX expires_idx (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin configuration
INSERT INTO admin_config (config_key, config_value) VALUES
    ('game_started', 'false'),
    ('exchange_date', '2025-12-25'),
    ('sms_enabled', 'true');

-- Sample data (optional - for testing)
-- Uncomment to add test participants
/*
INSERT INTO participants (first_name, phone_number, phone_last_four) VALUES
    ('John', '+11234567890', '7890'),
    ('Jane', '+11234567891', '7891'),
    ('Bob', '+11234567892', '7892'),
    ('Alice', '+11234567893', '7893');

-- Sample exclusion rules (spouses can't pick each other)
INSERT INTO exclusion_rules (participant_id, excluded_participant_id, reason) VALUES
    (1, 2, 'spouse'),
    (2, 1, 'spouse');
*/
