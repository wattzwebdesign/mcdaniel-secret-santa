const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');
const { validateNotificationPreferences } = require('../middleware/validation');

// All notification routes require authentication
router.use(requireAuth);

// GET /api/notifications/preferences - Get user's SMS preferences
router.get('/preferences', notificationController.getPreferences);

// PUT /api/notifications/preferences - Update SMS preferences
router.put('/preferences', validateNotificationPreferences, notificationController.updatePreferences);

// POST /api/notifications/test - Send test SMS
router.post('/test', notificationController.sendTest);

// GET /api/notifications/history - Get SMS history for user
router.get('/history', notificationController.getHistory);

module.exports = router;
