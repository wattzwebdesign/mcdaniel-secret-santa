const db = require('../config/database');
const assignmentService = require('../services/assignmentService');

// Get current assignment
async function getAssignment(req, res) {
    try {
        const participantId = req.session.participantId;

        const result = await assignmentService.getAssignment(participantId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching your assignment'
        });
    }
}

// Draw new assignment
async function drawAssignment(req, res) {
    try {
        const participantId = req.session.participantId;

        const result = await assignmentService.drawAssignment(participantId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Update session if successfully picked
        if (result.success && !result.alreadyPicked) {
            req.session.hasPicked = true;
        }

        res.json(result);
    } catch (error) {
        console.error('Draw assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while drawing your Secret Santa'
        });
    }
}

// Check if can pick
async function canPick(req, res) {
    try {
        const participantId = req.session.participantId;

        const result = await assignmentService.canParticipantPick(participantId);

        res.json(result);
    } catch (error) {
        console.error('Can pick check error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while checking pick eligibility'
        });
    }
}

// Get event details
async function getEventDetails(req, res) {
    try {
        const sql = 'SELECT * FROM event_settings LIMIT 1';
        const results = await db.query(sql);

        res.json({
            success: true,
            eventSettings: results.length > 0 ? results[0] : null
        });
    } catch (error) {
        console.error('Get event details error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching event details'
        });
    }
}

module.exports = {
    getAssignment,
    drawAssignment,
    canPick,
    getEventDetails
};
