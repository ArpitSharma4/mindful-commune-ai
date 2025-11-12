const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const {
  getAllConversations,
  getConversationMessages,
  createNewChat,
  handleChat,
  deleteConversation
} = require('./chat.controller');

const router = Router();

// --- All routes are protected ---
router.use(authMiddleware);

// --- COLLECTION ROUTES ---
// GET /api/chat
// Fetches all conversations for the sidebar.
router.get('/', getAllConversations);

// POST /api/chat/new
// Creates a new, blank conversation.

router.post('/new', createNewChat);

// GET /api/chat/:id
// Fetches all messages for a single conversation.
router.get('/:id', getConversationMessages);

// POST /api/chat/:id
// Handles sending a new message to an *existing* conversation.
router.post('/:id', handleChat);

// DELETE /api/chat/:id
// Deletes a conversation.
router.delete('/:id', deleteConversation);

module.exports = router;