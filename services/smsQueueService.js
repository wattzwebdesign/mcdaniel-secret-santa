const db = require('../config/database');
const twilioService = require('./twilioService');

// Add SMS to queue
async function queueSMS(participantId, phoneNumber, messageType, messageBody, priority = 5, scheduledFor = new Date()) {
    try {
        const sql = `
            INSERT INTO sms_queue
            (participant_id, phone_number, message_type, message_body, priority, scheduled_for)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const result = await db.query(sql, [
            participantId,
            phoneNumber,
            messageType,
            messageBody,
            priority,
            scheduledFor
        ]);

        return {
            success: true,
            queueId: result.insertId
        };
    } catch (error) {
        console.error('Error queueing SMS:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get pending SMS messages
async function getPendingSMS(limit = 10) {
    try {
        const sql = `
            SELECT
                id,
                participant_id,
                phone_number,
                message_type,
                message_body,
                priority,
                scheduled_for
            FROM sms_queue
            WHERE processed = FALSE
                AND scheduled_for <= NOW()
            ORDER BY priority ASC, scheduled_for ASC
            LIMIT ?
        `;

        const messages = await db.query(sql, [limit]);
        return messages;
    } catch (error) {
        console.error('Error fetching pending SMS:', error.message);
        return [];
    }
}

// Mark SMS as processed
async function markAsProcessed(queueId) {
    try {
        const sql = `
            UPDATE sms_queue
            SET processed = TRUE,
                processed_at = NOW()
            WHERE id = ?
        `;

        await db.query(sql, [queueId]);
        return true;
    } catch (error) {
        console.error('Error marking SMS as processed:', error.message);
        return false;
    }
}

// Process SMS queue (called by worker)
async function processQueue(maxMessages = 10) {
    try {
        // Check if we're within allowed hours
        if (!twilioService.isWithinAllowedHours()) {
            console.log('Outside allowed hours for SMS sending (9 AM - 9 PM)');
            return {
                processed: 0,
                message: 'Outside allowed hours'
            };
        }

        const pendingMessages = await getPendingSMS(maxMessages);

        if (pendingMessages.length === 0) {
            return {
                processed: 0,
                message: 'No pending messages'
            };
        }

        let successCount = 0;
        let failCount = 0;

        for (const message of pendingMessages) {
            try {
                // Send SMS via Twilio
                const twilioResponse = await twilioService.sendSMS(
                    message.phone_number,
                    message.message_body
                );

                // Log SMS result
                await twilioService.logSMS(
                    message.participant_id,
                    message.phone_number,
                    message.message_type,
                    message.message_body,
                    twilioResponse
                );

                // Mark as processed
                await markAsProcessed(message.id);

                if (twilioResponse.success) {
                    successCount++;
                } else {
                    failCount++;
                }

                // Small delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`Error processing message ${message.id}:`, error.message);
                failCount++;

                // Log failure
                await twilioService.logSMS(
                    message.participant_id,
                    message.phone_number,
                    message.message_type,
                    message.message_body,
                    {
                        success: false,
                        error: error.message
                    }
                );

                // Still mark as processed to avoid infinite retries
                await markAsProcessed(message.id);
            }
        }

        return {
            processed: successCount + failCount,
            success: successCount,
            failed: failCount,
            message: `Processed ${successCount + failCount} messages`
        };
    } catch (error) {
        console.error('Error processing SMS queue:', error.message);
        return {
            processed: 0,
            error: error.message
        };
    }
}

// Get queue statistics
async function getQueueStats() {
    try {
        const sql = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN processed = FALSE THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN processed = TRUE THEN 1 ELSE 0 END) as processed,
                MIN(CASE WHEN processed = FALSE THEN scheduled_for ELSE NULL END) as next_scheduled
            FROM sms_queue
        `;

        const [stats] = await db.query(sql);
        return stats || {
            total: 0,
            pending: 0,
            processed: 0,
            next_scheduled: null
        };
    } catch (error) {
        console.error('Error fetching queue stats:', error.message);
        return {
            total: 0,
            pending: 0,
            processed: 0,
            next_scheduled: null
        };
    }
}

// Clear old processed messages (cleanup)
async function cleanupProcessed(daysOld = 30) {
    try {
        const sql = `
            DELETE FROM sms_queue
            WHERE processed = TRUE
                AND processed_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;

        const result = await db.query(sql, [daysOld]);
        return {
            success: true,
            deleted: result.affectedRows
        };
    } catch (error) {
        console.error('Error cleaning up queue:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Cancel pending SMS for a participant
async function cancelPendingSMS(participantId, messageType = null) {
    try {
        let sql = `
            DELETE FROM sms_queue
            WHERE participant_id = ?
                AND processed = FALSE
        `;

        const params = [participantId];

        if (messageType) {
            sql += ' AND message_type = ?';
            params.push(messageType);
        }

        const result = await db.query(sql, params);
        return {
            success: true,
            cancelled: result.affectedRows
        };
    } catch (error) {
        console.error('Error cancelling SMS:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    queueSMS,
    getPendingSMS,
    markAsProcessed,
    processQueue,
    getQueueStats,
    cleanupProcessed,
    cancelPendingSMS
};
