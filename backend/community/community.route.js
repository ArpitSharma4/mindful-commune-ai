const { Router } = require('express');

// Import all controller functions
const {
  createCommunity,
  getAllCommunities,
  joinCommunity,
  leaveCommunity,
  getJoinedCommunities,
  getCommunityById,
} = require('./community.controller');
const authMiddleware = require('../middleware/auth');

const router = Router();

// --- PUBLIC ROUTE ---
// GET /api/communities -> Lists all communities
router.get('/', getAllCommunities);

// GET /api/community/:communityId -> Gets a specific community by ID
router.get('/:communityId', getCommunityById);

// --- PROTECTED ROUTES ---
// POST /api/communities/createCommunity -> Creates a new community
router.post('/createCommunity', authMiddleware, createCommunity);

// GET /api/communities/joined -> Gets communities the user has joined
router.get('/joined', authMiddleware, getJoinedCommunities);

// POST /api/communities/:communityId/join -> Joins a community
// This is a dynamic route where ':communityId' is a URL parameter.
router.post('/:communityId/join', authMiddleware, joinCommunity);

// POST /api/communities/:communityId/leave -> Leaves a community
router.post('/:communityId/leave', authMiddleware, leaveCommunity);

module.exports = router;
