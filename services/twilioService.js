const twilio = require('twilio');
const { parsePhoneNumber } = require('libphonenumber-js');
const db = require('../config/database');

// Initialize Twilio client
let twilioClient = null;

function getTwilioClient() {
    if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }
    return twilioClient;
}

// Format phone number to E.164 format
function formatPhoneNumber(phoneNumber) {
    try {
        const parsed = parsePhoneNumber(phoneNumber, 'US');
        if (parsed && parsed.isValid()) {
            return parsed.number; // Returns E.164 format (+1XXXXXXXXXX)
        }
        throw new Error('Invalid phone number');
    } catch (error) {
        console.error('Phone number formatting error:', error.message);
        throw new Error('Invalid phone number format');
    }
}

// Extract last 4 digits from phone number
function extractLastFour(phoneNumber) {
    const formatted = formatPhoneNumber(phoneNumber);
    return formatted.slice(-4);
}

// Check if SMS is enabled globally
function isSmsEnabled() {
    return process.env.SMS_ENABLED === 'true';
}

// Check if current time is within allowed hours (9 AM - 9 PM)
function isWithinAllowedHours() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 9 && hour < 21; // 9 AM to 9 PM
}

// Send SMS via Twilio
async function sendSMS(phoneNumber, messageBody) {
    try {
        // Check if SMS is enabled
        if (!isSmsEnabled()) {
            console.log('SMS disabled - would have sent:', { phoneNumber, messageBody });
            return {
                success: true,
                sid: 'SMS_DISABLED',
                status: 'sent',
                message: 'SMS sending is disabled'
            };
        }

        // Check time restrictions
        if (!isWithinAllowedHours()) {
            throw new Error('SMS can only be sent between 9 AM and 9 PM');
        }

        const client = getTwilioClient();
        if (!client) {
            throw new Error('Twilio client not initialized');
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!fromNumber) {
            throw new Error('TWILIO_PHONE_NUMBER not configured');
        }

        const message = await client.messages.create({
            body: messageBody,
            to: formattedPhone,
            from: fromNumber,
            statusCallback: `${process.env.APP_URL}/api/webhooks/twilio/status`
        });

        return {
            success: true,
            sid: message.sid,
            status: message.status,
            dateCreated: message.dateCreated
        };
    } catch (error) {
        console.error('Twilio SMS error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Log SMS to database
async function logSMS(participantId, phoneNumber, messageType, messageBody, twilioResponse) {
    try {
        const sql = `
            INSERT INTO sms_logs
            (participant_id, phone_number, message_type, message_body, twilio_sid, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const status = twilioResponse.success ? 'sent' : 'failed';
        const twilioSid = twilioResponse.sid || null;
        const errorMessage = twilioResponse.error || null;

        await db.query(sql, [
            participantId,
            phoneNumber,
            messageType,
            messageBody,
            twilioSid,
            status,
            errorMessage
        ]);

        return true;
    } catch (error) {
        console.error('Error logging SMS:', error.message);
        return false;
    }
}

// Update SMS delivery status (called by webhook)
async function updateSMSStatus(twilioSid, status, errorMessage = null) {
    try {
        const sql = `
            UPDATE sms_logs
            SET status = ?,
                error_message = ?,
                delivered_at = CASE WHEN ? = 'delivered' THEN NOW() ELSE delivered_at END
            WHERE twilio_sid = ?
        `;

        await db.query(sql, [status, errorMessage, status, twilioSid]);
        return true;
    } catch (error) {
        console.error('Error updating SMS status:', error.message);
        return false;
    }
}

// Get SMS logs for participant
async function getSMSLogs(participantId, limit = 50) {
    try {
        const sql = `
            SELECT
                id,
                message_type,
                message_body,
                status,
                error_message,
                sent_at,
                delivered_at
            FROM sms_logs
            WHERE participant_id = ?
            ORDER BY sent_at DESC
            LIMIT ?
        `;

        const logs = await db.query(sql, [participantId, limit]);
        return logs;
    } catch (error) {
        console.error('Error fetching SMS logs:', error.message);
        return [];
    }
}

// Get SMS statistics
async function getSMSStats() {
    try {
        const sql = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                message_type,
                DATE(sent_at) as date
            FROM sms_logs
            GROUP BY message_type, DATE(sent_at)
            ORDER BY sent_at DESC
            LIMIT 100
        `;

        const stats = await db.query(sql);
        return stats;
    } catch (error) {
        console.error('Error fetching SMS stats:', error.message);
        return [];
    }
}

// Validate Twilio configuration
async function validateTwilioConfig() {
    try {
        const client = getTwilioClient();
        if (!client) {
            return {
                valid: false,
                message: 'Twilio credentials not configured'
            };
        }

        // Test by fetching account info
        const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();

        return {
            valid: true,
            accountName: account.friendlyName,
            status: account.status
        };
    } catch (error) {
        return {
            valid: false,
            message: error.message
        };
    }
}

module.exports = {
    sendSMS,
    logSMS,
    updateSMSStatus,
    getSMSLogs,
    getSMSStats,
    formatPhoneNumber,
    extractLastFour,
    isSmsEnabled,
    isWithinAllowedHours,
    validateTwilioConfig
};
