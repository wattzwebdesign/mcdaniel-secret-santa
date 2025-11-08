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

// Get SMS template previews
async function getSMSTemplates(req, res) {
    try {
        const smsTemplates = require('../templates/smsTemplates');
        const appUrl = process.env.APP_URL || 'http://localhost:3000';

        // Get sample participant for preview
        const [sampleParticipant] = await db.query(
            'SELECT first_name FROM participants LIMIT 1'
        );

        const recipientName = sampleParticipant?.first_name || 'John';
        const firstName = 'Jane';

        const templates = {
            game_start: {
                name: 'Game Start Notification',
                description: 'Sent when admin starts the Secret Santa game',
                preview: smsTemplates.getGameStartMessage(appUrl),
                type: 'game_start'
            },
            assignment: {
                name: 'Assignment Notification',
                description: 'Sent when participant draws their Secret Santa',
                preview: smsTemplates.getAssignmentMessage(recipientName, appUrl),
                type: 'assignment'
            },
            wishlist_update: {
                name: 'Wish List Update',
                description: 'Sent when recipient updates their wish list',
                preview: smsTemplates.getWishListUpdateMessage(recipientName, appUrl),
                type: 'wishlist_update'
            },
            wishlist_reminder: {
                name: 'Wish List Reminder',
                description: 'Reminds participants to add wish list items',
                preview: smsTemplates.getWishListReminderMessage(appUrl),
                type: 'wishlist_reminder'
            },
            shopping_reminder: {
                name: 'Shopping Reminder',
                description: 'Reminds participants to shop for their person',
                preview: smsTemplates.getShoppingReminderMessage(recipientName, 7, appUrl),
                type: 'shopping_reminder'
            },
            exchange_day: {
                name: 'Exchange Day Reminder',
                description: 'Sent on the day of gift exchange',
                preview: smsTemplates.getExchangeDayMessage(recipientName),
                type: 'exchange_day'
            },
            test: {
                name: 'Test Message',
                description: 'Test message to verify SMS is working',
                preview: smsTemplates.getTestMessage(firstName),
                type: 'test'
            }
        };

        // Add character counts
        Object.keys(templates).forEach(key => {
            const validation = smsTemplates.validateMessageLength(templates[key].preview);
            templates[key].length = validation.length;
            templates[key].segments = validation.segments;
            templates[key].isSingleSegment = validation.isSingleSegment;
        });

        res.json({
            success: true,
            templates,
            smsEnabled: process.env.SMS_ENABLED === 'true'
        });
    } catch (error) {
        console.error('Get SMS templates error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching SMS templates'
        });
    }
}

// Get exchange event settings
async function getEventSettings(req, res) {
    try {
        const settings = await db.query(
            'SELECT config_key, config_value FROM admin_config WHERE config_key IN (?, ?, ?, ?)',
            ['exchange_date', 'exchange_title', 'exchange_time', 'exchange_location']
        );

        const settingsObj = {};
        settings.forEach(row => {
            settingsObj[row.config_key] = row.config_value;
        });

        res.json({
            success: true,
            settings: settingsObj
        });
    } catch (error) {
        console.error('Get event settings error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching event settings'
        });
    }
}

// Update exchange event settings
async function updateEventSettings(req, res) {
    try {
        const { exchange_date, exchange_title, exchange_time, exchange_location } = req.body;

        const updates = [
            ['exchange_date', exchange_date],
            ['exchange_title', exchange_title],
            ['exchange_time', exchange_time],
            ['exchange_location', exchange_location]
        ];

        for (const [key, value] of updates) {
            if (value !== undefined) {
                await db.query(
                    'INSERT INTO admin_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                    [key, value, value]
                );
            }
        }

        res.json({
            success: true,
            message: 'Event settings updated successfully'
        });
    } catch (error) {
        console.error('Update event settings error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating event settings'
        });
    }
}

// Get editable SMS templates from database
async function getEditableSMSTemplates(req, res) {
    try {
        const templates = await db.query(
            'SELECT id, template_type, template_name, template_body, description FROM sms_templates ORDER BY id'
        );

        res.json({
            success: true,
            templates: templates || []
        });
    } catch (error) {
        console.error('Get editable SMS templates error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching SMS templates'
        });
    }
}

// Update SMS template
async function updateSMSTemplate(req, res) {
    try {
        const { id } = req.params;
        const { template_body } = req.body;

        if (!template_body) {
            return res.status(400).json({
                success: false,
                message: 'Template body is required'
            });
        }

        await db.query(
            'UPDATE sms_templates SET template_body = ? WHERE id = ?',
            [template_body, id]
        );

        res.json({
            success: true,
            message: 'Template updated successfully'
        });
    } catch (error) {
        console.error('Update SMS template error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating template'
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
    getSMSStats,
    getSMSTemplates,
    getEventSettings,
    updateEventSettings,
    getEditableSMSTemplates,
    updateSMSTemplate
};
