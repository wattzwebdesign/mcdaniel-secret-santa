-- Add exchange event settings to admin_config
INSERT INTO admin_config (config_key, config_value) VALUES
    ('exchange_title', 'McDaniel Family Christmas Exchange'),
    ('exchange_time', '18:00'),
    ('exchange_location', '')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- Create SMS templates table
CREATE TABLE IF NOT EXISTS sms_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_type VARCHAR(50) UNIQUE NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_body TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_type (template_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default SMS templates
INSERT INTO sms_templates (template_type, template_name, template_body, description) VALUES
    ('game_start', 'Game Start Notification', '🎅 Ho Ho Ho! Secret Santa is ready!\n\nLogin at {appUrl} with your name and last 4 digits of this number to draw your person.\n\nDon''t forget to add your wish list! 🎁', 'Sent when admin starts the Secret Santa game'),

    ('assignment', 'Assignment Notification', '🎄 You''ve drawn your Secret Santa!\n\nYou''re shopping for: {recipientName}\n\nView their wish list at {appUrl}/recipient-wishlist.html\n\nKeep it secret! 🤫', 'Sent when participant draws their Secret Santa'),

    ('wishlist_update', 'Wish List Update', '🎁 Good news!\n\n{recipientName} just updated their wish list!\n\nCheck it out: {appUrl}/recipient-wishlist.html', 'Sent when recipient updates their wish list'),

    ('wishlist_reminder', 'Wish List Reminder', '🎅 Reminder: Your Secret Santa is waiting!\n\nHelp them pick the perfect gift by adding to your wish list at {appUrl}/wishlist.html', 'Reminds participants to add wish list items'),

    ('shopping_reminder', 'Shopping Reminder', '⏰ Just a reminder!\n\nSecret Santa exchange is in {daysRemaining} day{daysPlural}!\n\nDon''t forget to shop for {recipientName}!\n\nTheir wish list: {appUrl}/recipient-wishlist.html', 'Reminds participants to shop for their person'),

    ('exchange_day', 'Exchange Day Reminder', '🎉 Today''s the day!\n\n{eventTitle}\n{eventTime} at {eventLocation}\n\nYou''re giving to: {recipientName}\n\nHave fun! 🎅🎁', 'Sent on the day of gift exchange'),

    ('test', 'Test Message', '🧪 Test Message\n\nHi {firstName}! This is a test message from your Secret Santa app.\n\nIf you received this, SMS notifications are working! ✅', 'Test message to verify SMS is working')
ON DUPLICATE KEY UPDATE
    template_name = VALUES(template_name),
    template_body = VALUES(template_body),
    description = VALUES(description);
