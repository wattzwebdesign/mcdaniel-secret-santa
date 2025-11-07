const db = require('../config/database');
const exclusionService = require('./exclusionService');
const notificationService = require('./notificationService');

// Get available recipients for a participant
async function getAvailableRecipients(participantId) {
    try {
        const sql = `
            SELECT p.id, p.first_name
            FROM participants p
            WHERE p.id != ?
                AND p.id NOT IN (
                    SELECT assigned_to_id
                    FROM participants
                    WHERE assigned_to_id IS NOT NULL
                )
                AND p.id NOT IN (
                    SELECT excluded_participant_id
                    FROM exclusion_rules
                    WHERE participant_id = ?
                )
            ORDER BY p.first_name
        `;

        const available = await db.query(sql, [participantId, participantId]);
        return available;
    } catch (error) {
        console.error('Error getting available recipients:', error.message);
        return [];
    }
}

// Check for deadlock scenario
async function wouldCauseDeadlock(participantId, potentialRecipientId) {
    try {
        // Get all participants who haven't picked yet (excluding current participant)
        const sql = `
            SELECT id
            FROM participants
            WHERE has_picked = FALSE
                AND id != ?
        `;

        const unpickedParticipants = await db.query(sql, [participantId]);

        // If this is the last person picking, no deadlock possible
        if (unpickedParticipants.length === 0) {
            return false;
        }

        // Check if any unpicked participant would have no valid options
        // if we assign potentialRecipientId to current participant
        for (const unpicked of unpickedParticipants) {
            const availableSql = `
                SELECT COUNT(*) as count
                FROM participants p
                WHERE p.id != ?
                    AND p.id != ?
                    AND p.id NOT IN (
                        SELECT assigned_to_id
                        FROM participants
                        WHERE assigned_to_id IS NOT NULL
                            AND id != ?
                    )
                    AND p.id NOT IN (
                        SELECT excluded_participant_id
                        FROM exclusion_rules
                        WHERE participant_id = ?
                    )
            `;

            const [result] = await db.query(availableSql, [
                unpicked.id,
                potentialRecipientId,
                participantId,
                unpicked.id
            ]);

            if (result.count === 0) {
                // This assignment would leave someone with no options
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking for deadlock:', error.message);
        return false;
    }
}

// Draw Secret Santa assignment
async function drawAssignment(participantId) {
    try {
        // Check if participant exists
        const checkSql = `
            SELECT id, first_name, has_picked, assigned_to_id
            FROM participants
            WHERE id = ?
        `;

        const [participant] = await db.query(checkSql, [participantId]);

        if (!participant) {
            return {
                success: false,
                error: 'Participant not found'
            };
        }

        // Check if already picked
        if (participant.has_picked && participant.assigned_to_id) {
            const [assignedTo] = await db.query(
                'SELECT first_name FROM participants WHERE id = ?',
                [participant.assigned_to_id]
            );

            return {
                success: true,
                alreadyPicked: true,
                assignedTo: assignedTo ? assignedTo.first_name : 'Unknown',
                assignedToId: participant.assigned_to_id
            };
        }

        // Get available recipients
        let availableRecipients = await getAvailableRecipients(participantId);

        if (availableRecipients.length === 0) {
            return {
                success: false,
                error: 'No available recipients. Please contact the administrator.'
            };
        }

        // Filter out recipients that would cause deadlocks
        const safeRecipients = [];
        for (const recipient of availableRecipients) {
            const causesDeadlock = await wouldCauseDeadlock(participantId, recipient.id);
            if (!causesDeadlock) {
                safeRecipients.push(recipient);
            }
        }

        if (safeRecipients.length === 0) {
            return {
                success: false,
                error: 'Cannot complete assignment due to exclusion rules. Please contact administrator.'
            };
        }

        // Randomly select from safe recipients
        const randomIndex = Math.floor(Math.random() * safeRecipients.length);
        const selectedRecipient = safeRecipients[randomIndex];

        // Use transaction to update assignment
        const result = await db.transaction(async (connection) => {
            // Update participant with assignment
            await connection.execute(
                `UPDATE participants
                 SET assigned_to_id = ?,
                     has_picked = TRUE,
                     picked_at = NOW()
                 WHERE id = ?`,
                [selectedRecipient.id, participantId]
            );

            return selectedRecipient;
        });

        // Send notification asynchronously (don't wait for it)
        notificationService.notifyAssignment(participantId, result.first_name)
            .catch(err => console.error('Error sending assignment notification:', err));

        return {
            success: true,
            assignedTo: result.first_name,
            assignedToId: result.id,
            alreadyPicked: false
        };
    } catch (error) {
        console.error('Error drawing assignment:', error.message);
        return {
            success: false,
            error: 'An error occurred while drawing your Secret Santa'
        };
    }
}

// Get participant's current assignment
async function getAssignment(participantId) {
    try {
        const sql = `
            SELECT
                p.has_picked,
                p.assigned_to_id,
                r.first_name as assigned_to_name,
                p.picked_at
            FROM participants p
            LEFT JOIN participants r ON p.assigned_to_id = r.id
            WHERE p.id = ?
        `;

        const [assignment] = await db.query(sql, [participantId]);

        if (!assignment) {
            return {
                success: false,
                error: 'Participant not found'
            };
        }

        if (!assignment.has_picked || !assignment.assigned_to_id) {
            return {
                success: true,
                hasPicked: false
            };
        }

        return {
            success: true,
            hasPicked: true,
            assignedTo: assignment.assigned_to_name,
            assignedToId: assignment.assigned_to_id,
            pickedAt: assignment.picked_at
        };
    } catch (error) {
        console.error('Error getting assignment:', error.message);
        return {
            success: false,
            error: 'An error occurred while fetching assignment'
        };
    }
}

// Reset all assignments (keep participants and exclusions)
async function resetAllAssignments() {
    try {
        const sql = `
            UPDATE participants
            SET assigned_to_id = NULL,
                has_picked = FALSE,
                picked_at = NULL
        `;

        const result = await db.query(sql);

        return {
            success: true,
            reset: result.affectedRows
        };
    } catch (error) {
        console.error('Error resetting assignments:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get game status
async function getGameStatus() {
    try {
        const sql = `
            SELECT
                COUNT(*) as total_participants,
                SUM(CASE WHEN has_picked = TRUE THEN 1 ELSE 0 END) as picked_count,
                SUM(CASE WHEN has_picked = FALSE THEN 1 ELSE 0 END) as not_picked_count
            FROM participants
        `;

        const [status] = await db.query(sql);

        // Get list of who hasn't picked
        const notPickedSql = `
            SELECT id, first_name, phone_last_four
            FROM participants
            WHERE has_picked = FALSE
            ORDER BY first_name
        `;

        const notPicked = await db.query(notPickedSql);

        // Get list of who has picked
        const pickedSql = `
            SELECT
                p.id,
                p.first_name,
                p.picked_at,
                r.first_name as assigned_to_name
            FROM participants p
            LEFT JOIN participants r ON p.assigned_to_id = r.id
            WHERE p.has_picked = TRUE
            ORDER BY p.picked_at DESC
        `;

        const picked = await db.query(pickedSql);

        return {
            success: true,
            totalParticipants: status.total_participants || 0,
            pickedCount: status.picked_count || 0,
            notPickedCount: status.not_picked_count || 0,
            percentComplete: status.total_participants > 0
                ? Math.round((status.picked_count / status.total_participants) * 100)
                : 0,
            notPicked,
            picked
        };
    } catch (error) {
        console.error('Error getting game status:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Check if participant can pick
async function canParticipantPick(participantId) {
    try {
        const sql = `
            SELECT has_picked, assigned_to_id
            FROM participants
            WHERE id = ?
        `;

        const [participant] = await db.query(sql, [participantId]);

        if (!participant) {
            return {
                canPick: false,
                reason: 'Participant not found'
            };
        }

        if (participant.has_picked && participant.assigned_to_id) {
            return {
                canPick: false,
                reason: 'You have already drawn your Secret Santa'
            };
        }

        // Check if there are available recipients
        const available = await getAvailableRecipients(participantId);

        if (available.length === 0) {
            return {
                canPick: false,
                reason: 'No available recipients at this time'
            };
        }

        return {
            canPick: true,
            availableCount: available.length
        };
    } catch (error) {
        console.error('Error checking if can pick:', error.message);
        return {
            canPick: false,
            reason: 'An error occurred'
        };
    }
}

module.exports = {
    drawAssignment,
    getAssignment,
    getAvailableRecipients,
    resetAllAssignments,
    getGameStatus,
    canParticipantPick,
    wouldCauseDeadlock
};
