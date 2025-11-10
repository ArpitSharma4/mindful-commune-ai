const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const { getGamificationStatus } = require('./gamification.controller');

const router = Router();

// This is the route for your "Your Achievements" modal
router.get('/status', authMiddleware, getGamificationStatus);

module.exports = router;