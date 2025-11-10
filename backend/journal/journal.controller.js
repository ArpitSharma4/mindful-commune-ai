const pool = require('../db');
const { Parser } = require('json2csv');
/**
 * Creates a new, private journal entry for the logged-in user. (Protected)
 */
const createJournalEntry = async (req, res) => {
  try {
    const { title, content, mood } = req.body;
    const userId = req.user.userId;

    console.log('Creating journal entry for user:', userId);
    console.log('Entry data:', { title, content, mood });

    if (!content) {
      return res.status(400).json({ error: 'Content is required for a journal entry.' });
    }

    const query = `
      INSERT INTO journal_entries (author_id, title, content, mood)
      VALUES ($1, $2, $3, $4)
      RETURNING entry_id, title, content, mood, created_at, 
                COALESCE(updated_at, created_at) as updated_at;
    `;
    const result = await pool.query(query, [userId, title, content, mood]);
    console.log('Journal entry created successfully:', result.rows[0]);

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
    console.log(`Fetching journal entries for user: ${userId}`); // Your debug log

    const query = `
      SELECT 
        entry_id, 
        title, 
        content,
        mood, 
        created_at,
        COALESCE(updated_at, created_at) as updated_at
      FROM journal_entries 
      WHERE author_id = $1 
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching journal entries:', error); // Log the actual error
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
        mood = COALESCE($3, mood),
        updated_at = NOW()
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
    const entryQuery = 'SELECT content, author_id, ai_feedback FROM journal_entries WHERE entry_id = $1';
    const entryResult = await pool.query(entryQuery, [entryId]);

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }

    const entry = entryResult.rows[0];
    if (entry.author_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: You are not the author of this entry.' });
    }

    // If feedback already exists in the database, return it immediately.
    // This saves an expensive API call and ensures consistency.
    if (entry.ai_feedback) {
      console.log(`[Cache Hit] Returning saved feedback for entryId: ${entryId}`);
      return res.status(200).json({ feedback: entry.ai_feedback });
    }

    console.log(`[Cache Miss] Generating new feedback for entryId: ${entryId}`);
    
    const journalContent = entry.content;

    // 2. Define the System Prompt for the AI's persona and rules
    const systemPrompt = `You are 'Mindwell,' a supportive and empathetic journaling companion. Your primary purpose is to provide a brief, reflective summary of the user's journal entry after they have finished writing.
      Your response MUST be a statement of feedback, not a question.
      Your rules are:
        1.  **Always be supportive and non-judgmental.** Your tone should be warm and understanding.
        2.  **Do NOT give medical advice or act like a licensed therapist.** You are a companion, not a clinician.
        3.  **Do NOT, under any circumstances, ask the user any questions.** This includes open-ended questions (e.g., "Why did you feel that way?"). Your response must be a statement.
        4.  **Your feedback must identify the primary emotion or theme** from the user's text and gently reflect it back. (e.g., 'It sounds like you felt a real sense of accomplishment today.' or 'You're navigating a lot of pressure right now, and it's understandable to feel overwhelmed.')
        5.  **Keep your feedback concise (2-4 sentences).** 
        6.  **If the text seems potentially related to self-harm or crisis, ONLY respond with the exact text: CRISIS_DETECTED**`;

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
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
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

      // 6. Update the journal entry in the database with the new AI feedback and sentiment
    const updateQuery = `
      UPDATE journal_entries 
      SET ai_feedback = $1, ai_sentiment = $2 
      WHERE entry_id = $3 AND author_id = $4;
    `;

    await pool.query(updateQuery, [aiResponseText, sentiment, entryId, userId]);

    // 7. Send the AI's feedback back to the user
    res.status(200).json({ feedback: aiResponseText });

  } catch (error) {
    // Catch errors from the initial database fetch or ownership check
    console.error('Error getting AI feedback:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Calculates and returns journaling statistics for the logged-in user. (Protected)
 */
const getJournalStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // --- Query 1: Total Entries ---
    const totalQuery = 'SELECT COUNT(*) AS total_entries FROM journal_entries WHERE author_id = $1';
    const totalResult = await pool.query(totalQuery, [userId]);
    const totalEntries = parseInt(totalResult.rows[0].total_entries, 10);

    // --- Query 2: Average Mood ---
    // Map moods to numbers (e.g., great=5, good=4, okay=3, bad=2, awful=1)
    // Handle cases where mood is null or not in the expected set (defaults to 3/okay)
    const avgMoodQuery = `
      SELECT AVG(
        CASE mood
          WHEN 'great' THEN 5
          WHEN 'good' THEN 4
          WHEN 'okay' THEN 3
          WHEN 'bad' THEN 2
          WHEN 'awful' THEN 1
          ELSE 3 
        END
      ) AS average_mood
      FROM journal_entries
      WHERE author_id = $1 AND mood IS NOT NULL;
    `;
    const avgMoodResult = await pool.query(avgMoodQuery, [userId]);
    // Use parseFloat and handle potential null result if user has no entries with moods
    const averageMoodRaw = avgMoodResult.rows[0]?.average_mood;
    const averageMood = averageMoodRaw ? parseFloat(parseFloat(averageMoodRaw).toFixed(1)) : null; // Round to 1 decimal place

    // --- Query 3: Last Entry Date ---
    const lastEntryQuery = `
      SELECT created_at AS last_entry_date 
      FROM journal_entries 
      WHERE author_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;
    const lastEntryResult = await pool.query(lastEntryQuery, [userId]);
    const lastEntryDate = lastEntryResult.rows.length > 0 ? lastEntryResult.rows[0].last_entry_date : null;

    // --- Query 4 & Calculation: Current Streak ---
    const streakQuery = `
      SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') AS entry_date 
      FROM journal_entries 
      WHERE author_id = $1 
      ORDER BY entry_date DESC;
    `;
    const streakResult = await pool.query(streakQuery, [userId]);
    const entryDates = streakResult.rows.map(row => new Date(row.entry_date));

    let currentStreak = 0;
    if (entryDates.length > 0) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); // Normalize today's date to UTC midnight
      const yesterday = new Date(today);
      yesterday.setUTCDate(today.getUTCDate() - 1); // Get yesterday's date

      // Check if the most recent entry was today or yesterday
      if (entryDates[0].getTime() === today.getTime() || entryDates[0].getTime() === yesterday.getTime()) {
        currentStreak = 1;
        // Loop backwards from the second most recent entry
        for (let i = 1; i < entryDates.length; i++) {
          const expectedPreviousDate = new Date(entryDates[i-1]);
          expectedPreviousDate.setUTCDate(expectedPreviousDate.getUTCDate() - 1); // Calculate the day before the previous entry

          if (entryDates[i].getTime() === expectedPreviousDate.getTime()) {
            currentStreak++; // Dates are consecutive, increment streak
          } else {
            break; // Gap detected, streak ends
          }
        }
      }
    }

    await pool.query(updateQuery, [aiResponseText, sentiment, entryId, userId]);
    // --- Combine Results ---
    res.status(200).json({
      totalEntries: totalEntries,
      averageMood: averageMood, // Numerical average (e.g., 4.2) or null
      currentStreak: currentStreak,
      lastEntryDate: lastEntryDate
    });

  } catch (error) {
    console.error('Error fetching journal stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// List of predefined journaling prompts
const JOURNAL_PROMPTS = [
  "What is one thing you are grateful for today?",
  "Describe a small victory or achievement you had recently.",
  "What is something that's been on your mind lately?",
  "Write about a challenge you faced and how you navigated it.",
  "What activity brought you joy recently?",
  "If you could give your past self some advice, what would it be?",
  "What are you looking forward to in the coming week?",
  "Describe a moment when you felt proud of yourself.",
  "What is one thing you learned today?",
  "How did you practice self-care today?",
  "Write about something that made you smile.",
  "What is a goal you are currently working towards?",
  "Describe a place where you feel calm and relaxed.",
  "What is one worry you can let go of right now?",
  "Reflect on a recent conversation that impacted you.",
];

/**
 * Returns a small, random selection of journaling prompts. (Protected)
 */
const getJournalPrompts = async (req, res) => {
  try {
    // We don't need userId for the logic, but accessing req.user confirms authentication middleware ran.
    // console.log(`Fetching prompts for user: ${req.user.userId}`); 

    const numberOfPrompts = 3; // How many prompts to return
    const shuffledPrompts = [...JOURNAL_PROMPTS].sort(() => 0.5 - Math.random()); // Shuffle the array
    const selectedPrompts = shuffledPrompts.slice(0, numberOfPrompts); // Take the first N prompts

    res.status(200).json(selectedPrompts);

  } catch (error) {
    console.error('Error fetching journal prompts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Exports all journal entries for the logged-in user as a JSON file. (Protected)
 */
const exportJournalEntries = async (req, res) => {
  try {
    // 1. Get the requested format from the URL query, defaulting to 'json'
    const { format = 'json' } = req.query;
    const userId = req.user.userId;
    console.log(`Exporting all journal entries for user: ${userId} as [${format}]`);

    // 2. Fetch all journal entries from the database (same as before)
    const query = `
      SELECT 
        entry_id, 
        title, 
        content,
        mood, 
        ai_sentiment,
        created_at,
        COALESCE(updated_at, created_at) as updated_at
      FROM journal_entries 
      WHERE author_id = $1 
      ORDER BY created_at ASC; 
    `;
    const result = await pool.query(query, [userId]);
    const entries = result.rows;

    // 3. Declare variables for our output
    let outputData;
    let contentType;
    const
      fileDate = new Date().toISOString().split('T')[0];
    let fileName = `journal_export_${fileDate}`;

    // 4. Use a switch statement to format the data
    switch (format) {
      case 'csv':
        // --- CSV Format ---
        // Define the columns for the CSV file
        const fields = ['created_at', 'title', 'mood', 'ai_sentiment', 'content', 'entry_id', 'updated_at'];
        const json2csvParser = new Parser({ fields });
        outputData = json2csvParser.parse(entries);
        
        contentType = 'text/csv';
        fileName += '.csv';
        break;

      case 'txt':
        // --- TXT Format ---
        // Loop through entries and build a human-readable string
        let txtString = `My Journal Entries\r\nExported on: ${fileDate}\r\n\r\n`;
        
        for (const entry of entries) {
          txtString += `----------------------------------------\r\n`;
          txtString += `Date:    ${entry.created_at}\r\n`;
          txtString += `Title:   ${entry.title || '(No Title)'}\r\n`;
          txtString += `Mood:    ${entry.mood || 'N/A'}\r\n`;
          txtString += `\r\n`; // Add a space before content
          txtString += `${entry.content}\r\n\r\n`;
        }
        
        outputData = txtString;
        contentType = 'text/plain';
        fileName += '.txt';
        break;
        
      case 'json':
      default:
        // --- JSON Format (Default) ---
        // Use JSON.stringify to pretty-print the JSON
        outputData = JSON.stringify(entries, null, 2);
        contentType = 'application/json';
        fileName += '.json';
        break;
    }

    // 5. Send the response
    // Set headers (now using our dynamic variables)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Send the formatted data
    res.status(200).send(outputData);

  } catch (error) {
    console.error('Error exporting journal entries:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Now, add the new function to your module.exports at the very bottom
// of the file.



module.exports = {
  createJournalEntry,
  getAllJournalEntries,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
  getAIFeedback,
  getJournalStats,
  getJournalPrompts,
  exportJournalEntries,
};

