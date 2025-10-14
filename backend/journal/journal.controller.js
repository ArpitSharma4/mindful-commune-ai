const pool = require('../db');

/**
 * Creates a new, private journal entry for the logged-in user. (Protected)
 */
const createJournalEntry = async (req, res) => {
  try {
    const { title, content, mood } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Content is required for a journal entry.' });
    }

    const query = `
      INSERT INTO journal_entries (author_id, title, content, mood)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, title, content, mood]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Fetches a list of all journal entries for the logged-in user. (Protected)
 */
const getAllJournalEntries = async (req, res) => {
  try {
    const userId = req.user.userId;
    const query = `
      SELECT entry_id, title, mood, created_at 
      FROM journal_entries 
      WHERE author_id = $1 
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Fetches a single, specific journal entry by its ID. (Protected & Authorized)
 */
const getJournalEntryById = async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.userId;

    const query = 'SELECT * FROM journal_entries WHERE entry_id = $1';
    const result = await pool.query(query, [entryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }

    const entry = result.rows[0];
    if (entry.author_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: You are not the author of this entry.' });
    }

    res.status(200).json(entry);
  } catch (error) {
    console.error('Error fetching journal entry by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Updates a specific journal entry. (Protected & Authorized)
 */
const updateJournalEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.userId;
    const { title, content, mood } = req.body;

    const updateQuery = `
      UPDATE journal_entries
      SET 
        title = COALESCE($1, title), 
        content = COALESCE($2, content),
        mood = COALESCE($3, mood)
      WHERE entry_id = $4 AND author_id = $5
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [title, content, mood, entryId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Journal entry not found or you are not the author.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Deletes a specific journal entry. (Protected & Authorized)
 */
const deleteJournalEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.userId;

    const deleteQuery = 'DELETE FROM journal_entries WHERE entry_id = $1 AND author_id = $2';
    const result = await pool.query(deleteQuery, [entryId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Journal entry not found or you are not the author.' });
    }

    res.status(200).json({ message: 'Journal entry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createJournalEntry,
  getAllJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
};
