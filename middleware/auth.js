const bcrypt = require('bcrypt');

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (!req.session || !req.session.participantId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please login.'
        });
    }
    next();
}

// Middleware to check if user is admin
async function requireAdmin(req, res, next) {
    if (!req.session || !req.session.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
}

// Verify admin password
async function verifyAdminPassword(password) {
    try {
        const adminPassword = process.env.ADMIN_PASSWORD;

        // If admin password starts with $2, it's already hashed
        if (adminPassword.startsWith('$2')) {
            return await bcrypt.compare(password, adminPassword);
        }

        // Plain text comparison (for development only)
        return password === adminPassword;
    } catch (error) {
        console.error('Admin password verification error:', error);
        return false;
    }
}

// Optional: Check if user has picked
function requireHasPicked(req, res, next) {
    if (!req.session || !req.session.hasPicked) {
        return res.status(403).json({
            success: false,
            message: 'You must draw your Secret Santa first'
        });
    }
    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    verifyAdminPassword,
    requireHasPicked
};
