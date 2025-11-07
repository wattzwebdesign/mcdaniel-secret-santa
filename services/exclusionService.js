const db = require('../config/database');

// Add exclusion rule
async function addExclusion(participantId, excludedParticipantId, reason = null) {
    try {
        // Prevent self-exclusion
        if (participantId === excludedParticipantId) {
            throw new Error('A participant cannot exclude themselves');
        }

        const sql = `
            INSERT INTO exclusion_rules (participant_id, excluded_participant_id, reason)
            VALUES (?, ?, ?)
        `;

        const result = await db.query(sql, [participantId, excludedParticipantId, reason]);

        return {
            success: true,
            exclusionId: result.insertId
        };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                error: 'This exclusion rule already exists'
            };
        }

        console.error('Error adding exclusion:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Remove exclusion rule
async function removeExclusion(exclusionId) {
    try {
        const sql = `DELETE FROM exclusion_rules WHERE id = ?`;
        const result = await db.query(sql, [exclusionId]);

        return {
            success: true,
            deleted: result.affectedRows > 0
        };
    } catch (error) {
        console.error('Error removing exclusion:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get all exclusions for a participant
async function getExclusionsForParticipant(participantId) {
    try {
        const sql = `
            SELECT
                e.id,
                e.excluded_participant_id,
                p.first_name as excluded_name,
                e.reason,
                e.created_at
            FROM exclusion_rules e
            JOIN participants p ON e.excluded_participant_id = p.id
            WHERE e.participant_id = ?
            ORDER BY p.first_name
        `;

        const exclusions = await db.query(sql, [participantId]);
        return exclusions;
    } catch (error) {
        console.error('Error fetching exclusions:', error.message);
        return [];
    }
}

// Get all exclusion rules
async function getAllExclusions() {
    try {
        const sql = `
            SELECT
                e.id,
                e.participant_id,
                p1.first_name as participant_name,
                e.excluded_participant_id,
                p2.first_name as excluded_name,
                e.reason,
                e.created_at
            FROM exclusion_rules e
            JOIN participants p1 ON e.participant_id = p1.id
            JOIN participants p2 ON e.excluded_participant_id = p2.id
            ORDER BY p1.first_name, p2.first_name
        `;

        const exclusions = await db.query(sql);
        return exclusions;
    } catch (error) {
        console.error('Error fetching all exclusions:', error.message);
        return [];
    }
}

// Add family group exclusions (everyone in the group excludes everyone else)
async function addFamilyGroupExclusions(participantIds, reason = 'family') {
    try {
        if (participantIds.length < 2) {
            throw new Error('At least 2 participants required for a family group');
        }

        const exclusions = [];

        // Create exclusions for each pair
        for (let i = 0; i < participantIds.length; i++) {
            for (let j = 0; j < participantIds.length; j++) {
                if (i !== j) {
                    const result = await addExclusion(
                        participantIds[i],
                        participantIds[j],
                        reason
                    );

                    if (result.success) {
                        exclusions.push({
                            participantId: participantIds[i],
                            excludedId: participantIds[j],
                            exclusionId: result.exclusionId
                        });
                    }
                }
            }
        }

        return {
            success: true,
            added: exclusions.length,
            exclusions
        };
    } catch (error) {
        console.error('Error adding family group exclusions:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Check if participant A can pick participant B
async function canPick(participantAId, participantBId) {
    try {
        // Can't pick yourself
        if (participantAId === participantBId) {
            return false;
        }

        // Check if there's an exclusion rule
        const sql = `
            SELECT COUNT(*) as count
            FROM exclusion_rules
            WHERE participant_id = ? AND excluded_participant_id = ?
        `;

        const [result] = await db.query(sql, [participantAId, participantBId]);
        return result.count === 0;
    } catch (error) {
        console.error('Error checking if can pick:', error.message);
        return false;
    }
}

// Validate that the game is possible with current exclusion rules
async function validateGameIsPossible() {
    try {
        // Get all participants
        const participantsSql = `SELECT id FROM participants ORDER BY id`;
        const participants = await db.query(participantsSql);

        if (participants.length < 2) {
            return {
                possible: false,
                reason: 'Need at least 2 participants'
            };
        }

        // For each participant, check if they have at least one valid pick
        for (const participant of participants) {
            const validPicksSql = `
                SELECT COUNT(*) as count
                FROM participants p
                WHERE p.id != ?
                    AND p.id NOT IN (
                        SELECT excluded_participant_id
                        FROM exclusion_rules
                        WHERE participant_id = ?
                    )
            `;

            const [result] = await db.query(validPicksSql, [
                participant.id,
                participant.id
            ]);

            if (result.count === 0) {
                // Get participant name for error message
                const [participantData] = await db.query(
                    'SELECT first_name FROM participants WHERE id = ?',
                    [participant.id]
                );

                return {
                    possible: false,
                    reason: `${participantData.first_name} has no valid people to pick`,
                    participantId: participant.id
                };
            }
        }

        // Additional check: detect circular exclusions that could cause deadlocks
        // This is a simplified check - a more thorough check would use graph theory
        const totalParticipants = participants.length;
        const exclusionCountSql = `
            SELECT COUNT(*) as count FROM exclusion_rules
        `;
        const [exclusionCount] = await db.query(exclusionCountSql);

        // If more than 50% of possible combinations are excluded, warn
        const maxPossiblePairs = totalParticipants * (totalParticipants - 1);
        if (exclusionCount.count > maxPossiblePairs * 0.5) {
            return {
                possible: true,
                warning: 'Many exclusions present - assignment may be difficult',
                exclusionPercentage: Math.round((exclusionCount.count / maxPossiblePairs) * 100)
            };
        }

        return {
            possible: true,
            message: 'Game is possible with current rules'
        };
    } catch (error) {
        console.error('Error validating game:', error.message);
        return {
            possible: false,
            reason: 'Error validating game: ' + error.message
        };
    }
}

// Get exclusion statistics
async function getExclusionStats() {
    try {
        const sql = `
            SELECT
                COUNT(DISTINCT participant_id) as participants_with_exclusions,
                COUNT(*) as total_exclusions,
                COUNT(DISTINCT reason) as unique_reasons
            FROM exclusion_rules
        `;

        const [stats] = await db.query(sql);
        return stats || {
            participants_with_exclusions: 0,
            total_exclusions: 0,
            unique_reasons: 0
        };
    } catch (error) {
        console.error('Error fetching exclusion stats:', error.message);
        return {
            participants_with_exclusions: 0,
            total_exclusions: 0,
            unique_reasons: 0
        };
    }
}

module.exports = {
    addExclusion,
    removeExclusion,
    getExclusionsForParticipant,
    getAllExclusions,
    addFamilyGroupExclusions,
    canPick,
    validateGameIsPossible,
    getExclusionStats
};
