const { Router } = require('express');
const authMiddleware = require('../middleware/auth');
const {
  createJournalEntry,
  getAllJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
} = require('./journal.controller');

const router = Router();

// --- All Journaling Routes are Protected ---
// A user must be logged in to access any of these endpoints.

// POST /api/journal -> Create a new journal entry
router.post('/', authMiddleware, createJournalEntry);

// GET /api/journal -> Get a list of all of the user's journal entries
router.get('/', authMiddleware, getAllJournalEntries);

// GET /api/journal/:entryId -> Get a single journal entry by its ID
router.get('/:entryId', authMiddleware, getJournalEntryById);

// PUT /api/journal/:entryId -> Update a journal entry
router.put('/:entryId', authMiddleware, updateJournalEntry);

// DELETE /api/journal/:entryId -> Delete a journal entry
router.delete('/:entryId', authMiddleware, deleteJournalEntry);

module.exports = router;
