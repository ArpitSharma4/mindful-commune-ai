const { Router } = require('express');

// Import all controller functions from the controller file
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


// --- PUBLIC ROUTES ---

// GET /api/communities -> Lists all communities
router.get('/', getAllCommunities);


// --- PROTECTED ROUTES (Specific paths first) ---
// Specific string routes MUST be defined before dynamic routes with parameters.

// POST /api/communities -> Creates a new community (Protected)
router.post('/', authMiddleware, createCommunity);

// GET /api/communities/joined -> Gets communities the current user has joined (Protected)
router.get('/joined', authMiddleware, getJoinedCommunities);


// --- DYNAMIC ROUTES (ID-based, must be last) ---
// These routes with a URL parameter like ':communityId' must be defined after
// any specific routes to avoid conflicts.

// GET /api/communities/:communityId -> Gets a specific community by ID (Public)
router.get('/:communityId', getCommunityById);

// POST /api/communities/:communityId/join -> Joins a community (Protected)
router.post('/:communityId/join', authMiddleware, joinCommunity);

// POST /api/communities/:communityId/leave -> Leaves a community (Protected)
router.post('/:communityId/leave', authMiddleware, leaveCommunity);


module.exports = router;

