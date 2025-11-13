const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const {
  createJournalEntry,
  getAllJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
  getAIFeedback,
  getJournalStats,
  getJournalPrompts,
  exportJournalEntries,
  getJournalInsights,
} = require('./journal.controller');

const router = Router();

// --- All Journaling Routes are Protected ---
// A user must be logged in to access any of these endpoints.

// POST /api/journal -> Create a new journal entry
router.post('/', authMiddleware, createJournalEntry);

// GET /api/journal -> Get a list of all of the user's journal entries
router.get('/', authMiddleware, getAllJournalEntries);

//GET /api/journal/stats -> Get journal statistics for the user
router.get('/stats', authMiddleware, getJournalStats);

// GET /api/journal/prompts -> Get journaling prompts
router.get('/prompts', authMiddleware, getJournalPrompts);

// GET /api/journal/insights -> Get journal insights and analytics
router.get('/insights', authMiddleware, getJournalInsights);

// --- NEW EXPORT ROUTE ---
// GET /api/journal/export -> Download all user's entries as a JSON file
// (Place this BEFORE the '/:entryId' route)
router.get('/export', authMiddleware, exportJournalEntries);

// GET /api/journal/:entryId -> Get a single journal entry by its ID
router.get('/:entryId', authMiddleware, getJournalEntryById);

// PUT /api/journal/:entryId -> Update a journal entry
router.put('/:entryId', authMiddleware, updateJournalEntry);

// DELETE /api/journal/:entryId -> Delete a journal entry
router.delete('/:entryId', authMiddleware, deleteJournalEntry);

// --- AI Interaction Route (Protected) ---
// POST /api/journal/:entryId/analyze
router.post('/:entryId/analyze', authMiddleware, getAIFeedback);

module.exports = router;