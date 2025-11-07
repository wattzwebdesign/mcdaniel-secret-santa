const db = require('../config/database');
const smsQueueService = require('./smsQueueService');
const smsTemplates = require('../templates/smsTemplates');

// Check if participant wants to receive a specific notification type
async function shouldReceiveNotification(participantId, notificationType) {
    try {
        const sql = `
            SELECT sms_enabled, notify_on_assignment, notify_on_wishlist_update,
                   notify_on_game_start, notify_reminders
            FROM participants
            WHERE id = ?
        `;

        const [participant] = await db.query(sql, [participantId]);

        if (!participant || !participant.sms_enabled) {
            return false;
        }

        switch (notificationType) {
            case 'assignment':
                return participant.notify_on_assignment;
            case 'wishlist_update':
                return participant.notify_on_wishlist_update;
            case 'game_start':
                return participant.notify_on_game_start;
            case 'wishlist_reminder':
            case 'shopping_reminder':
            case 'exchange_day':
                return participant.notify_reminders;
            default:
                return false;
        }
    } catch (error) {
        console.error('Error checking notification preferences:', error.message);
        return false;
    }
}

// Send game start notification to all participants
async function notifyGameStart() {
    try {
        const sql = `
            SELECT id, phone_number, first_name
            FROM participants
            WHERE sms_enabled = TRUE AND notify_on_game_start = TRUE
        `;

        const participants = await db.query(sql);
        const message = smsTemplates.getMessage('game_start');

        let queued = 0;

        for (const participant of participants) {
            const result = await smsQueueService.queueSMS(
                participant.id,
                participant.phone_number,
                'game_start',
                message,
                3 // Medium priority
            );

            if (result.success) {
                queued++;
            }
        }

        return {
            success: true,
            queued,
            total: participants.length
        };
    } catch (error) {
        console.error('Error sending game start notification:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send assignment notification
async function notifyAssignment(participantId, recipientName) {
    try {
        const shouldSend = await shouldReceiveNotification(participantId, 'assignment');

        if (!shouldSend) {
            return {
                success: true,
                message: 'Notification disabled by user preferences'
            };
        }

        const sql = `SELECT phone_number FROM participants WHERE id = ?`;
        const [participant] = await db.query(sql, [participantId]);

        if (!participant) {
            throw new Error('Participant not found');
        }

        const message = smsTemplates.getMessage('assignment', { recipientName });

        const result = await smsQueueService.queueSMS(
            participantId,
            participant.phone_number,
            'assignment',
            message,
            2 // High priority
        );

        return result;
    } catch (error) {
        console.error('Error sending assignment notification:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send wish list update notification to Santa
async function notifyWishListUpdate(recipientId) {
    try {
        // Find who is assigned to this recipient (their Santa)
        const sql = `
            SELECT p.id, p.phone_number, r.first_name as recipient_name
            FROM participants p
            JOIN participants r ON p.assigned_to_id = r.id
            WHERE p.assigned_to_id = ?
        `;

        const [santa] = await db.query(sql, [recipientId]);

        if (!santa) {
            // No one has picked this person yet
            return {
                success: true,
                message: 'No Secret Santa assigned yet'
            };
        }

        const shouldSend = await shouldReceiveNotification(santa.id, 'wishlist_update');

        if (!shouldSend) {
            return {
                success: true,
                message: 'Notification disabled by user preferences'
            };
        }

        const message = smsTemplates.getMessage('wishlist_update', {
            recipientName: santa.recipient_name
        });

        const result = await smsQueueService.queueSMS(
            santa.id,
            santa.phone_number,
            'wishlist_update',
            message,
            3 // Medium priority
        );

        return result;
    } catch (error) {
        console.error('Error sending wishlist update notification:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send wish list reminder to participants without items
async function notifyWishListReminders() {
    try {
        const sql = `
            SELECT p.id, p.phone_number, p.first_name
            FROM participants p
            WHERE p.has_picked = TRUE
                AND p.sms_enabled = TRUE
                AND p.notify_reminders = TRUE
                AND p.picked_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
                AND NOT EXISTS (
                    SELECT 1 FROM wish_list_items w
                    WHERE w.participant_id = p.id
                )
        `;

        const participants = await db.query(sql);
        const message = smsTemplates.getMessage('wishlist_reminder');

        let queued = 0;

        for (const participant of participants) {
            const result = await smsQueueService.queueSMS(
                participant.id,
                participant.phone_number,
                'wishlist_reminder',
                message,
                5 // Normal priority
            );

            if (result.success) {
                queued++;
            }
        }

        return {
            success: true,
            queued,
            total: participants.length
        };
    } catch (error) {
        console.error('Error sending wishlist reminders:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send shopping reminder (X days before exchange)
async function notifyShoppingReminder(daysBeforeExchange = 7) {
    try {
        const sql = `
            SELECT p.id, p.phone_number, r.first_name as recipient_name
            FROM participants p
            JOIN participants r ON p.assigned_to_id = r.id
            WHERE p.has_picked = TRUE
                AND p.sms_enabled = TRUE
                AND p.notify_reminders = TRUE
        `;

        const participants = await db.query(sql);
        let queued = 0;

        for (const participant of participants) {
            const message = smsTemplates.getMessage('shopping_reminder', {
                recipientName: participant.recipient_name,
                daysRemaining: daysBeforeExchange
            });

            const result = await smsQueueService.queueSMS(
                participant.id,
                participant.phone_number,
                'shopping_reminder',
                message,
                4 // Normal-low priority
            );

            if (result.success) {
                queued++;
            }
        }

        return {
            success: true,
            queued,
            total: participants.length
        };
    } catch (error) {
        console.error('Error sending shopping reminders:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send exchange day reminder
async function notifyExchangeDay() {
    try {
        const sql = `
            SELECT p.id, p.phone_number, r.first_name as recipient_name
            FROM participants p
            JOIN participants r ON p.assigned_to_id = r.id
            WHERE p.has_picked = TRUE
                AND p.sms_enabled = TRUE
                AND p.notify_reminders = TRUE
        `;

        const participants = await db.query(sql);
        let queued = 0;

        for (const participant of participants) {
            const message = smsTemplates.getMessage('exchange_day', {
                recipientName: participant.recipient_name
            });

            const result = await smsQueueService.queueSMS(
                participant.id,
                participant.phone_number,
                'exchange_day',
                message,
                1 // Highest priority
            );

            if (result.success) {
                queued++;
            }
        }

        return {
            success: true,
            queued,
            total: participants.length
        };
    } catch (error) {
        console.error('Error sending exchange day reminders:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Send test SMS
async function sendTestSMS(participantId) {
    try {
        const sql = `SELECT phone_number, first_name FROM participants WHERE id = ?`;
        const [participant] = await db.query(sql, [participantId]);

        if (!participant) {
            throw new Error('Participant not found');
        }

        const message = smsTemplates.getMessage('test', {
            firstName: participant.first_name
        });

        const result = await smsQueueService.queueSMS(
            participantId,
            participant.phone_number,
            'test',
            message,
            1 // Highest priority for testing
        );

        return result;
    } catch (error) {
        console.error('Error sending test SMS:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    shouldReceiveNotification,
    notifyGameStart,
    notifyAssignment,
    notifyWishListUpdate,
    notifyWishListReminders,
    notifyShoppingReminder,
    notifyExchangeDay,
    sendTestSMS
};
