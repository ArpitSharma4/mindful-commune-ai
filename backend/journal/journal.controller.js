  const pool = require('../db');
  const { Parser } = require('json2csv');
  const { checkAndAwardAchievements } = require('../gamification/gamification.controller');
  const { generateEmbedding } = require('../utils/aiHelpers'); 
  const { pineconeIndex } = require('../utils/pineconeClient')
  /**
   * Creates a new, private journal entry for the logged-in user. (Protected)
   */
  const createJournalEntry = async (req, res) => {
  const client = await pool.connect(); // Use a client for transactions
  try {
    const { title, content, mood } = req.body;
    const userId = req.user.userId;

    console.log('Creating journal entry for user:', userId);
    console.log('Entry data:', { title, content, mood });

    if (!content) {
      return res.status(400).json({ error: 'Content is required for a journal entry.' });
    }

    await client.query('BEGIN');

    // 1. Insert the text content into Postgres
    const query = `
      INSERT INTO journal_entries (author_id, title, content, mood)
      VALUES ($1, $2, $3, $4)
      RETURNING entry_id, title, content, mood, created_at, 
                COALESCE(updated_at, created_at) as updated_at;
    `;
    const result = await client.query(query, [userId, title, content, mood]);
    const newEntry = result.rows[0];
    const newEntryId = newEntry.entry_id;

    console.log('Journal entry created successfully:', newEntry);

    // 2. Call your custom achievement logic
    // We await this to ensure it's part of the transaction
    await checkAndAwardAchievements(userId, client).catch(err => console.error('Error checking achievements:', err));
    // Note: I've passed the 'client' to this function. 
    // If it makes its own DB calls, it should use this client to be part of the transaction.
    // If it's not DB-related, you can remove the 'await'.

    await client.query('COMMIT');

    // 3. Respond to the user immediately for a fast UI
    res.status(201).json(newEntry);

    // 4. (In Background) Generate and save embedding to Pinecone
    // This runs as a "fire-and-forget" task.
    (async () => {
      try {
        console.log(`[Pinecone Write] Generating embedding for new entry: ${newEntryId}`);
        const embedding = await generateEmbedding(newEntry.content);
        
        await pineconeIndex.upsert([
          {
            id: newEntryId, // The Postgres entry_id
            values: embedding, // The 768-dimension vector
            metadata: {
              userId: userId // Store the userId for filtering
            }
          }
        ]);
        console.log(`[Pinecone Write] Successfully saved embedding for: ${newEntryId}`);
      } catch (err) {
        // This log is important, as the user will not see this error
        console.error(`[Pinecone Write Error] Failed to save embedding for ${newEntryId}:`, err);
      }
    })(); 

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating journal entry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
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

    // 1. Update the entry in Postgres
    const updateQuery = `
      UPDATE journal_entries
      SET 
        title = COALESCE($1, title), 
        content = COALESCE($2, content),
        mood = COALESCE($3, mood),
        updated_at = NOW() -- Assuming you have an updated_at column
      WHERE entry_id = $4 AND author_id = $5
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [title, content, mood, entryId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Journal entry not found or you are not the author.' });
    }
    const updatedEntry = result.rows[0];

    // 2. Respond to the user immediately
    res.status(200).json(updatedEntry);

    // 3. (In Background) If the content changed, regenerate and update the embedding
    if (content) {
      (async () => {
        try {
          console.log(`[Pinecone Write] Re-generating embedding for updated entry: ${entryId}`);
          const embedding = await generateEmbedding(updatedEntry.content);
          
          await pineconeIndex.upsert([
            {
              id: entryId,
              values: embedding,
              metadata: {
                userId: userId
              }
            }
          ]);
          console.log(`[Pinecone Write] Successfully updated embedding for: ${entryId}`);
        } catch (err) {
          console.error(`[Pinecone Write Error] Failed to update embedding for ${entryId}:`, err);
        }
      })();
    }
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

    // 1. Delete from Postgres (and verify ownership)
    const deleteQuery = 'DELETE FROM journal_entries WHERE entry_id = $1 AND author_id = $2';
    const result = await pool.query(deleteQuery, [entryId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Journal entry not found or you are not the author.' });
    }

    // 2. Respond to the user immediately
    res.status(200).json({ message: 'Journal entry deleted successfully.' });

    // 3. (In Background) Delete the vector from Pinecone
    (async () => {
      try {
        console.log(`[Pinecone Write] Deleting embedding for: ${entryId}`);
        await pineconeIndex.deleteOne(entryId);
        console.log(`[Pinecone Write] Successfully deleted embedding for: ${entryId}`);
      } catch (err) {
        console.error(`[Pinecone Write Error] Failed to delete embedding for ${entryId}:`, err);
      }
    })();

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
          4.  **Your feedback must identify the primary emotion or theme** from the user's text and gently reflect it back and give suggestions on what they could have done if applicable.
          5.  **Keep your feedback concise.** 
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
          // maxOutputTokens: 512, // Limit the length of the AI's response
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

  /**
   * Helper function to find top 3 keywords associated with specific moods.
   */
  const getMoodKeywords = async (userId) => {
    // List of common words to ignore during analysis
    const stopWords = ['a', 'an', 'the', 'i', 'me', 'my', 'is', 'in', 'it', 'to', 'and', 'was', 'feel', 'feeling', 'that', 'this', 'but', 'so', 'for', 'of', 'on', 'at', 'with', 'just', 'today', 'really', 'like'];
    const targetMoods = ['great', 'bad', 'awful'];

    // This complex query tokenizes the text, removes short words and stop words, and counts the rest.
    const keywordQuery = `
      WITH mood_filtered_words AS (
        -- Split content into individual words and map them to their mood
        SELECT 
          LOWER(REGEXP_SPLIT_TO_TABLE(TRIM(content), '\\s+')) AS word,
          mood
        FROM journal_entries
        WHERE author_id = $1 
          AND mood IN ('great', 'bad', 'awful')
          AND content IS NOT NULL
      )
      SELECT 
        word,
        mood,
        COUNT(*) as word_count
      FROM mood_filtered_words
      WHERE LENGTH(word) > 3 
        AND word <> ALL ($2::text[]) -- Filter out stop words
      GROUP BY 1, 2
      ORDER BY mood, word_count DESC;
    `;
    
    const result = await pool.query(keywordQuery, [userId, stopWords]);

    // Format the flat SQL result into a structured object for the frontend
    const formattedKeywords = {};
    targetMoods.forEach(mood => formattedKeywords[mood] = []);

    result.rows.forEach(row => {
      // Only take the top 3 keywords per mood for efficiency
      if (formattedKeywords[row.mood] && formattedKeywords[row.mood].length < 3) {
        formattedKeywords[row.mood].push({ word: row.word, count: parseInt(row.word_count, 10) });
      }
    });

    return formattedKeywords;
  };

  /**
   * Fetches journal insights including mood trends, sentiment distribution, and keyword correlations.
   */
  const getJournalInsights = async (req, res) => {
    try {
      const userId = req.user.userId;
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      // 1. Mood Trend Data (last 90 days)
      const insightsQuery = `
        WITH mood_scores AS (
          SELECT 
            DATE(created_at) as date,
            CASE mood
              WHEN 'great' THEN 5
              WHEN 'good' THEN 4
              WHEN 'okay' THEN 3
              WHEN 'bad' THEN 2
              WHEN 'awful' THEN 1
              ELSE 3
            END as mood_score,
            COUNT(*) as daily_entries
          FROM journal_entries
          WHERE author_id = $1 
            AND created_at >= $2
            AND mood IS NOT NULL
          GROUP BY DATE(created_at), mood
        )
        SELECT 
          date,
          ROUND(AVG(mood_score), 2) as avg_mood_score,
          SUM(daily_entries) as daily_entries
        FROM mood_scores
        GROUP BY date
        ORDER BY date;
      `;
      
      const insightsResult = await pool.query(insightsQuery, [userId, threeMonthsAgo]);
      
      // 2. Sentiment Distribution
      const sentimentQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE mood IN ('great', 'good')) as positive,
          COUNT(*) FILTER (WHERE mood IN ('okay')) as neutral,
          COUNT(*) FILTER (WHERE mood IN ('bad', 'awful')) as negative
        FROM journal_entries
        WHERE author_id = $1;
      `;
      const sentimentResult = await pool.query(sentimentQuery, [userId]);
      const sentimentDistribution = {
        positive: parseInt(sentimentResult.rows[0].positive) || 0,
        neutral: parseInt(sentimentResult.rows[0].neutral) || 0,
        negative: parseInt(sentimentResult.rows[0].negative) || 0
      };
      
      // 3. Keyword Correlations
      const correlatedKeywords = await getMoodKeywords(userId);
      
      // 4. Format and return all insights
      res.status(200).json({
        moodTrend: insightsResult.rows,
        sentimentDistribution,
        correlatedKeywords
      });
      
    } catch (error) {
      console.error('Error fetching journal insights:', error);
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
    getJournalStats,
    getJournalPrompts,
    exportJournalEntries,
    getJournalInsights,
  };

