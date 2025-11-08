const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');
const {
    validateParticipant,
    validateExclusionRule,
    validateFamilyGroup,
    validateIdParam
} = require('../middleware/validation');

// All admin routes require admin authentication
router.use(requireAdmin);

// Participant Management
router.get('/participants', adminController.getParticipants);
router.post('/participants', validateParticipant, adminController.addParticipant);
router.put('/participants/:id', validateIdParam, validateParticipant, adminController.updateParticipant);
router.delete('/participants/:id', validateIdParam, adminController.removeParticipant);

// Exclusion Management
router.get('/exclusions', adminController.getExclusions);
router.post('/exclusions', validateExclusionRule, adminController.addExclusion);
router.delete('/exclusions/:id', validateIdParam, adminController.removeExclusion);
router.post('/family-group', validateFamilyGroup, adminController.addFamilyGroup);

// Game Management
router.get('/status', adminController.getStatus);
router.post('/reset-assignments', adminController.resetAssignments);
router.post('/reset-all', adminController.resetAll);
router.get('/validate', adminController.validateGame);

// Notification Management
router.post('/notifications/send-all', adminController.sendNotificationToAll);
router.post('/notifications/reminder', adminController.sendReminder);
router.get('/notifications/logs', adminController.getSMSLogs);
router.get('/notifications/queue', adminController.getSMSQueue);
router.get('/notifications/stats', adminController.getSMSStats);
router.get('/notifications/templates', adminController.getSMSTemplates);

// Settings Management
router.get('/settings/event', adminController.getEventSettings);
router.put('/settings/event', adminController.updateEventSettings);
router.get('/settings/sms-templates', adminController.getEditableSMSTemplates);
router.put('/settings/sms-templates/:id', adminController.updateSMSTemplate);

module.exports = router;
