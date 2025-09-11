const { Router } = require('express');
const { createCommunity } = require('./community.controller');
const authMiddleware = require('../middleware/auth'); // <-- Import our security guard!

const router = Router();

// To create a community, the user MUST be authenticated.
// The authMiddleware will run first. If the token is valid, it calls next()
// which then runs the createCommunity function.
router.post('/createCommunity', authMiddleware, createCommunity);

// We can add other public or protected community routes here later.
// For example, getting all communities might not require authentication.
// router.get('/', getAllCommunities);

module.exports = router;

