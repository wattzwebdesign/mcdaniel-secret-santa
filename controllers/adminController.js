const db = require('../config/database');
const twilioService = require('../services/twilioService');
const exclusionService = require('../services/exclusionService');
const assignmentService = require('../services/assignmentService');
const notificationService = require('../services/notificationService');
const smsQueueService = require('../services/smsQueueService');

// Get all participants
async function getParticipants(req, res) {
    try {
        const sql = `
            SELECT
                id,
                first_name,
                phone_number,
                phone_last_four,
                has_picked,
                picked_at,
                sms_enabled,
                created_at
            FROM participants
            ORDER BY first_name ASC
        `;

        const participants = await db.query(sql);

        res.json({
            success: true,
            participants
        });
    } catch (error) {
        console.error('Get participants error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching participants'
        });
    }
}

// Add participant
async function addParticipant(req, res) {
    try {
        const { firstName, phoneNumber } = req.body;

        const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);
        const lastFour = twilioService.extractLastFour(formattedPhone);

        const sql = `
            INSERT INTO participants (first_name, phone_number, phone_last_four)
            VALUES (?, ?, ?)
        `;

        const result = await db.query(sql, [firstName, formattedPhone, lastFour]);

        res.json({
            success: true,
            participantId: result.insertId,
            message: 'Participant added successfully'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'This participant already exists'
            });
        }

        console.error('Add participant error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding participant'
        });
    }
}

// Remove participant
async function removeParticipant(req, res) {
    try {
        const participantId = parseInt(req.params.id);

        const sql = `DELETE FROM participants WHERE id = ?`;
        const result = await db.query(sql, [participantId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }

        res.json({
            success: true,
            message: 'Participant removed successfully'
        });
    } catch (error) {
        console.error('Remove participant error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while removing participant'
        });
    }
}

// Get all exclusions
async function getExclusions(req, res) {
    try {
        const exclusions = await exclusionService.getAllExclusions();

        res.json({
            success: true,
            exclusions
        });
    } catch (error) {
        console.error('Get exclusions error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching exclusions'
        });
    }
}

// Add exclusion
async function addExclusion(req, res) {
    try {
        const { participantId, excludedParticipantId, reason } = req.body;

        const result = await exclusionService.addExclusion(
            participantId,
            excludedParticipantId,
            reason
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Add exclusion error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding exclusion'
        });
    }
}

// Remove exclusion
async function removeExclusion(req, res) {
    try {
        const exclusionId = parseInt(req.params.id);

        const result = await exclusionService.removeExclusion(exclusionId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        if (!result.deleted) {
            return res.status(404).json({
                success: false,
                message: 'Exclusion not found'
            });
        }

        res.json({
            success: true,
            message: 'Exclusion removed successfully'
        });
    } catch (error) {
        console.error('Remove exclusion error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while removing exclusion'
        });
    }
}

// Add family group exclusions
async function addFamilyGroup(req, res) {
    try {
        const { participantIds, reason } = req.body;

        const result = await exclusionService.addFamilyGroupExclusions(
            participantIds,
            reason
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Add family group error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding family group'
        });
    }
}

// Get game status
async function getStatus(req, res) {
    try {
        const result = await assignmentService.getGameStatus();

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching game status'
        });
    }
}

// Reset assignments
async function resetAssignments(req, res) {
    try {
        const result = await assignmentService.resetAllAssignments();

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json({
            success: true,
            message: `Reset ${result.reset} assignments successfully`
        });
    } catch (error) {
        console.error('Reset assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while resetting assignments'
        });
    }
}

// Reset all data
async function resetAll(req, res) {
    try {
        await db.transaction(async (connection) => {
            await connection.execute('DELETE FROM wish_list_purchases');
            await connection.execute('DELETE FROM wish_list_items');
            await connection.execute('DELETE FROM sms_queue');
            await connection.execute('DELETE FROM sms_logs');
            await connection.execute('DELETE FROM exclusion_rules');
            await connection.execute('DELETE FROM participants');
        });

        res.json({
            success: true,
            message: 'All data cleared successfully'
        });
    } catch (error) {
        console.error('Reset all error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while clearing data'
        });
    }
}

// Validate game
async function validateGame(req, res) {
    try {
        const result = await exclusionService.validateGameIsPossible();

        res.json(result);
    } catch (error) {
        console.error('Validate game error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while validating game'
        });
    }
}

// Send notification to all participants
async function sendNotificationToAll(req, res) {
    try {
        const { type } = req.body;

        let result;

        switch (type) {
            case 'game_start':
                result = await notificationService.notifyGameStart();
                break;
            case 'wishlist_reminder':
                result = await notificationService.notifyWishListReminders();
                break;
            case 'shopping_reminder':
                result = await notificationService.notifyShoppingReminder(7);
                break;
            case 'exchange_day':
                result = await notificationService.notifyExchangeDay();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid notification type'
                });
        }

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while sending notifications'
        });
    }
}

// Send specific reminder
async function sendReminder(req, res) {
    try {
        const { type, daysRemaining } = req.body;

        let result;

        if (type === 'shopping') {
            result = await notificationService.notifyShoppingReminder(
                daysRemaining || 7
            );
        } else if (type === 'wishlist') {
            result = await notificationService.notifyWishListReminders();
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid reminder type'
            });
        }

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Send reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while sending reminder'
        });
    }
}

// Get SMS logs
async function getSMSLogs(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 100;

        const sql = `
            SELECT
                s.id,
                s.participant_id,
                p.first_name,
                s.phone_number,
                s.message_type,
                s.message_body,
                s.status,
                s.error_message,
                s.sent_at,
                s.delivered_at
            FROM sms_logs s
            JOIN participants p ON s.participant_id = p.id
            ORDER BY s.sent_at DESC
            LIMIT ?
        `;

        const logs = await db.query(sql, [limit]);

        res.json({
            success: true,
            logs
        });
    } catch (error) {
        console.error('Get SMS logs error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching SMS logs'
        });
    }
}

// Get SMS statistics
async function getSMSStats(req, res) {
    try {
        const stats = await twilioService.getSMSStats();
        const queueStats = await smsQueueService.getQueueStats();

        res.json({
            success: true,
            deliveryStats: stats,
            queueStats
        });
    } catch (error) {
        console.error('Get SMS stats error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching SMS statistics'
        });
    }
}

module.exports = {
    getParticipants,
    addParticipant,
    removeParticipant,
    getExclusions,
    addExclusion,
    removeExclusion,
    addFamilyGroup,
    getStatus,
    resetAssignments,
    resetAll,
    validateGame,
    sendNotificationToAll,
    sendReminder,
    getSMSLogs,
    getSMSStats
};
