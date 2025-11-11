const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const {
  getAllConversations,
  createNewChat,
  getConversationMessages,
  handleChat,
  deleteConversation // <-- ADD THIS
} = require('./chat.controller'); // Make sure this filename is correct

const router = Router();

// GET /api/chat
// Fetches all conversation titles for the sidebar
router.get('/', authMiddleware, getAllConversations);

// POST /api/chat
// Creates a new, blank chat and returns its ID
router.post('/', authMiddleware, createNewChat);

// GET /api/chat/:id
// Fetches all messages for a specific conversation
router.get('/:id', authMiddleware, getConversationMessages);

// POST /api/chat/:id
// Sends a new message to a specific conversation
router.post('/:id', authMiddleware, handleChat); // <-- THIS IS THE MISSING ROUTE

router.delete('/:id', authMiddleware, deleteConversation);


module.exports = router;