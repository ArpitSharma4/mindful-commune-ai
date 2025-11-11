const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const { handleChat, getChatHistory } = require('./chat.controller');

const router = Router();

// --- All Chat Routes are Protected ---

// GET /api/chat -> Get the user's entire chat history
router.get('/history', authMiddleware, getChatHistory);

// POST /api/chat -> Send a new message to the AI
router.post('/handle', authMiddleware, handleChat);

module.exports = router;