const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin, validateAdminPassword } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: { success: false, message: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

// POST /api/auth/login - Participant login
router.post('/login', loginLimiter, validateLogin, authController.login);

// POST /api/auth/admin/login - Admin login
router.post('/admin/login', loginLimiter, validateAdminPassword, authController.adminLogin);

// POST /api/auth/logout - Logout
router.post('/logout', authController.logout);

// GET /api/auth/status - Check authentication status
router.get('/status', authController.status);

module.exports = router;
