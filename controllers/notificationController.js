const db = require('../config/database');
const twilioService = require('../services/twilioService');
const notificationService = require('../services/notificationService');

// Get notification preferences
async function getPreferences(req, res) {
    try {
        const participantId = req.session.participantId;

        const sql = `
            SELECT
                sms_enabled,
                notify_on_assignment,
                notify_on_wishlist_update,
                notify_on_game_start,
                notify_reminders
            FROM participants
            WHERE id = ?
        `;

        const [preferences] = await db.query(sql, [participantId]);

        if (!preferences) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }

        res.json({
            success: true,
            preferences: {
                smsEnabled: Boolean(preferences.sms_enabled),
                notifyOnAssignment: Boolean(preferences.notify_on_assignment),
                notifyOnWishlistUpdate: Boolean(preferences.notify_on_wishlist_update),
                notifyOnGameStart: Boolean(preferences.notify_on_game_start),
                notifyReminders: Boolean(preferences.notify_reminders)
            }
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching preferences'
        });
    }
}

// Update notification preferences
async function updatePreferences(req, res) {
    try {
        const participantId = req.session.participantId;
        const {
            smsEnabled,
            notifyOnAssignment,
            notifyOnWishlistUpdate,
            notifyOnGameStart,
            notifyReminders
        } = req.body;

        const updates = [];
        const values = [];

        if (smsEnabled !== undefined) {
            updates.push('sms_enabled = ?');
            values.push(smsEnabled ? 1 : 0);
        }
        if (notifyOnAssignment !== undefined) {
            updates.push('notify_on_assignment = ?');
            values.push(notifyOnAssignment ? 1 : 0);
        }
        if (notifyOnWishlistUpdate !== undefined) {
            updates.push('notify_on_wishlist_update = ?');
            values.push(notifyOnWishlistUpdate ? 1 : 0);
        }
        if (notifyOnGameStart !== undefined) {
            updates.push('notify_on_game_start = ?');
            values.push(notifyOnGameStart ? 1 : 0);
        }
        if (notifyReminders !== undefined) {
            updates.push('notify_reminders = ?');
            values.push(notifyReminders ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No preferences to update'
            });
        }

        values.push(participantId);

        const sql = `
            UPDATE participants
            SET ${updates.join(', ')}
            WHERE id = ?
        `;

        await db.query(sql, values);

        res.json({
            success: true,
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating preferences'
        });
    }
}

// Send test SMS
async function sendTest(req, res) {
    try {
        const participantId = req.session.participantId;

        const result = await notificationService.sendTestSMS(participantId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            message: 'Test SMS queued successfully. You should receive it shortly.'
        });
    } catch (error) {
        console.error('Send test SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while sending test SMS'
        });
    }
}

// Get SMS history
async function getHistory(req, res) {
    try {
        const participantId = req.session.participantId;
        const limit = parseInt(req.query.limit) || 50;

        const logs = await twilioService.getSMSLogs(participantId, limit);

        res.json({
            success: true,
            logs
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching SMS history'
        });
    }
}

module.exports = {
    getPreferences,
    updatePreferences,
    sendTest,
    getHistory
};
