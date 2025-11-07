const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const { requireAuth } = require('../middleware/auth');

// All participant routes require authentication
router.use(requireAuth);

// GET /api/participant/assignment - Get current assignment
router.get('/assignment', participantController.getAssignment);

// POST /api/participant/draw - Draw new assignment
router.post('/draw', participantController.drawAssignment);

// GET /api/participant/can-pick - Check if eligible to pick
router.get('/can-pick', participantController.canPick);

module.exports = router;
