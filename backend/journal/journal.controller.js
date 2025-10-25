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

// --- NEW AI FEEDBACK FUNCTION ---

/**
 * Fetches AI feedback for a specific journal entry. (Protected & Authorized)
 */
const getAIFeedback = async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.userId;

    // 1. Fetch the journal entry and verify ownership
    const entryQuery = 'SELECT content, author_id FROM journal_entries WHERE entry_id = $1';
    const entryResult = await pool.query(entryQuery, [entryId]);

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }

    const entry = entryResult.rows[0];
    if (entry.author_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: You are not the author of this entry.' });
    }

    const journalContent = entry.content;

    // 2. Define the System Prompt for the AI's persona and rules
    const systemPrompt = `You are 'Mindwell,' a supportive and empathetic journaling companion. Your goal is to help users reflect on their thoughts and feelings in a safe and constructive way. Your rules are:
1.  Always be supportive and non-judgmental.
2.  Do NOT give medical advice or act like a licensed therapist. You are a companion, not a clinician.
3.  Ask open-ended questions if appropriate, to encourage further reflection.
4.  Identify the primary emotion or theme in the user's text and gently reflect it back.
5.  Keep your feedback concise (2-4 sentences).
6.  If the text seems potentially related to self-harm or crisis, ONLY respond with the exact text: CRISIS_DETECTED`;

    // 3. Prepare the payload for the Gemini API
    const apiKey = process.env.GEMINI_API_KEY || ""; // Use environment variable
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      // System instructions guide the model's persona
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      // The user's journal entry is the main content
      contents: [{
        parts: [{ text: journalContent }]
      }],
      // Configuration to ensure safety (adjust thresholds as needed)
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
      ],
      generationConfig: {
        temperature: 0.7, // Controls randomness (0 = deterministic, 1 = max random)
        topK: 1,
        topP: 1,
        maxOutputTokens: 512, // Limit the length of the AI's response
      },
    };

    // 4. Call the Gemini API with exponential backoff for retries
    let aiResponseText = '';
    let attempt = 0;
    const maxAttempts = 5;
    let delay = 1000; // Start with 1 second delay

    while (attempt < maxAttempts) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          // Handle specific API errors (like 429 Too Many Requests)
          if (response.status === 429 || response.status >= 500) {
            console.warn(`Gemini API request failed (attempt ${attempt + 1}): Status ${response.status}. Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Double the delay for the next retry
            attempt++;
            continue; // Retry the loop
          } else {
            // Handle other non-retryable errors
            const errorBody = await response.json();
            console.error('Gemini API Error:', response.status, errorBody);
            throw new Error(`Gemini API request failed with status ${response.status}`);
          }
        }

        const result = await response.json();

        // Safety check: Did the model block the response?
        if (result.candidates && result.candidates[0].finishReason === 'SAFETY') {
            aiResponseText = "I'm unable to provide feedback on this entry due to safety guidelines.";
            // Optionally, log this internally for review
            console.warn(`Gemini API blocked response for entryId ${entryId} due to safety.`);
        } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            aiResponseText = result.candidates[0].content.parts[0].text;
        } else {
            console.error('Unexpected Gemini API response structure:', result);
            aiResponseText = "Sorry, I couldn't generate feedback at this moment.";
        }

        // Check for our custom crisis detection flag
        if (aiResponseText.trim() === 'CRISIS_DETECTED') {
          // Handle crisis: Send a specific message and potentially log/notify
          console.warn(`CRISIS DETECTED for entryId: ${entryId}`);
          // Do NOT save sentiment. Return a standardized crisis response.
          // IMPORTANT: Replace the text/number with actual crisis resources.
          return res.status(200).json({
            feedback: "It sounds like you're going through a very difficult time. Please reach out for support. You can contact the National Suicide Prevention Lifeline at 988 or visit [Crisis Support Website]. You are not alone.",
            isCrisis: true // Flag for the frontend
          });
        }
        
        break; // Exit loop on success

      } catch (error) {
        if (attempt >= maxAttempts - 1) {
          console.error('Failed to get AI feedback after multiple retries:', error);
          return res.status(500).json({ error: 'Failed to get AI feedback. Please try again later.' });
        }
        // Handle potential network errors and retry
        console.warn(`Gemini API request failed (attempt ${attempt + 1}): ${error.message}. Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        attempt++;
      }
    }
    
    // If loop finished without success (e.g., max retries reached)
     if (!aiResponseText && attempt >= maxAttempts) {
       return res.status(500).json({ error: 'Failed to get AI feedback after multiple attempts.' });
     }

    // 5. (Optional but recommended) Extract sentiment - Simple keyword check for now
    let sentiment = 'neutral';
    const lowerCaseResponse = aiResponseText.toLowerCase();
    if (lowerCaseResponse.includes('positive') || lowerCaseResponse.includes('good') || lowerCaseResponse.includes('happy') || lowerCaseResponse.includes('great')) {
      sentiment = 'positive';
    } else if (lowerCaseResponse.includes('negative') || lowerCaseResponse.includes('difficult') || lowerCaseResponse.includes('sad') || lowerCaseResponse.includes('anxious') || lowerCaseResponse.includes('overwhelmed')) {
      sentiment = 'negative';
    }

    // 6. Update the journal entry in the database with the extracted sentiment
    const updateSentimentQuery = `
      UPDATE journal_entries SET ai_sentiment = $1 WHERE entry_id = $2 AND author_id = $3;
    `;
    await pool.query(updateSentimentQuery, [sentiment, entryId, userId]);

    // 7. Send the AI's feedback back to the user
    res.status(200).json({ feedback: aiResponseText });

  } catch (error) {
    // Catch errors from the initial database fetch or ownership check
    console.error('Error getting AI feedback:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createJournalEntry,
  getAllJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
  getAIFeedback,
};

