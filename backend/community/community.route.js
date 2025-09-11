const { Router } = require('express');

// Import all three controller functions
const {
  createCommunity,
  getAllCommunities,
  joinCommunity,
} = require('./community.controller');
const authMiddleware = require('../middleware/auth');

const router = Router();

// --- PUBLIC ROUTE ---
// GET /api/communities -> Lists all communities
router.get('/', getAllCommunities);

// --- PROTECTED ROUTES ---
// POST /api/communities/createCommunity -> Creates a new community
router.post('/createCommunity', authMiddleware, createCommunity);

// POST /api/communities/:communityId/join -> Joins a community
// This is a dynamic route where ':communityId' is a URL parameter.
router.post('/:communityId/join', authMiddleware, joinCommunity);

module.exports = router;

