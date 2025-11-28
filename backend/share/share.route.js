const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const { generateShareLink } = require('./share.controller');

const router = Router();

// Protected: validate request and return a canonical share URL for a post
router.post('/generate', authMiddleware, generateShareLink);

module.exports = router;
