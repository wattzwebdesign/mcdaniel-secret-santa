const db = require('../config/database');
const twilioService = require('../services/twilioService');
const { verifyAdminPassword } = require('../middleware/auth');

// Login participant
async function login(req, res) {
    try {
        const { firstName, phoneNumber } = req.body;

        // Format phone number and extract last 4 digits
        const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);
        const lastFour = twilioService.extractLastFour(formattedPhone);

        // Find participant by first name and phone last four
        const sql = `
            SELECT id, first_name, phone_number, phone_last_four, has_picked, assigned_to_id
            FROM participants
            WHERE first_name = ? AND phone_last_four = ?
        `;

        const [participant] = await db.query(sql, [firstName, lastFour]);

        if (!participant) {
            return res.status(401).json({
                success: false,
                message: 'Invalid name or phone number'
            });
        }

        // Set session
        req.session.participantId = participant.id;
        req.session.firstName = participant.first_name;
        req.session.hasPicked = participant.has_picked;
        req.session.isAdmin = false;

        res.json({
            success: true,
            participant: {
                id: participant.id,
                firstName: participant.first_name,
                hasPicked: participant.has_picked
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
}

// Admin login
async function adminLogin(req, res) {
    try {
        const { password } = req.body;

        const isValid = await verifyAdminPassword(password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin password'
            });
        }

        // Set admin session
        req.session.isAdmin = true;
        req.session.participantId = null;

        res.json({
            success: true,
            message: 'Admin login successful'
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during admin login'
        });
    }
}

// Logout
async function logout(req, res) {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'An error occurred during logout'
                });
            }

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during logout'
        });
    }
}

// Check authentication status
async function status(req, res) {
    try {
        if (!req.session || !req.session.participantId) {
            return res.json({
                authenticated: false,
                isAdmin: req.session?.isAdmin || false
            });
        }

        res.json({
            authenticated: true,
            isAdmin: req.session.isAdmin || false,
            participant: {
                id: req.session.participantId,
                firstName: req.session.firstName,
                hasPicked: req.session.hasPicked
            }
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred checking authentication status'
        });
    }
}

module.exports = {
    login,
    adminLogin,
    logout,
    status
};
