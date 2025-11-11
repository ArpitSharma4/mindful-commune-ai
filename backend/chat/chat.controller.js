const pool = require('../db');

/**
 * Fetches the user's entire chat history. (Protected)
 */
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const historyQuery = 'SELECT chat_history FROM users WHERE user_id = $1';
    const historyResult = await pool.query(historyQuery, [userId]);
    const savedChatHistory = historyResult.rows[0]?.chat_history || [];
    res.status(200).json(savedChatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Helper function to search a user's journals for relevant entries.
 */
const searchJournals = async (userId, userMessage) => {
  try {
    // A simple keyword extractor. We'll ignore common, small "stop words".
    const stopWords = ['a', 'an', 'the', 'is', 'in', 'on', 'what', 'my', 'i', 'me', 'about', 'ever', 'have', 'feel', 'feeling'];
    const keywords = userMessage.toLowerCase()
      .replace(/[?,.]/g, '') // Remove punctuation
      .split(' ')
      .filter(word => word.length > 3 && !stopWords.includes(word));

    if (keywords.length === 0) {
      return []; // No keywords to search for
    }

    // Build a dynamic query: "WHERE content ILIKE '%word1%' OR content ILIKE '%word2%'..."
    const ilikeClauses = keywords.map((_, index) => `content ILIKE $${index + 2}`).join(' OR ');
    const queryParams = [userId, ...keywords.map(kw => `%${kw}%`)];
    
    const searchQuery = `
      SELECT content, created_at
      FROM journal_entries
      WHERE author_id = $1 AND (${ilikeClauses})
      ORDER BY created_at DESC
      LIMIT 3;
    `;

    const searchResult = await pool.query(searchQuery, queryParams);
    return searchResult.rows;

  } catch (error) {
    console.error('Error searching journals:', error);
    return []; // Return empty on error, so chat can continue
  }
};


/**
 * Handles a new message in a multi-turn conversational chat with the AI.
 */
const handleChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // 1. Fetch existing chat history
    const historyQuery = 'SELECT chat_history FROM users WHERE user_id = $1';
    const historyResult = await pool.query(historyQuery, [userId]);
    const savedChatHistory = historyResult.rows[0]?.chat_history || [];

    // 2. --- NEW "AGENT" LOGIC: Detect if this is a memory question ---
    let relevantEntries = [];
    const memoryKeywords = ['remember', 'in my journal', 'have i ever', 'tell me about', 'my past', 'what did i say about'];
    const isMemoryQuestion = memoryKeywords.some(kw => message.toLowerCase().includes(kw));

    if (isMemoryQuestion) {
      console.log(`[RAG] Detected memory question. Searching journals...`);
      // 3. --- RETRIEVAL ---
      // If it is, search the user's journals for relevant context.
      relevantEntries = await searchJournals(userId, message);
    }

    // 4. --- AUGMENTATION ---
    // Build the context for Gemini.
    const geminiHistory = [
      ...savedChatHistory, // Start with the chat history
    ];

    // If we found relevant entries, "augment" the context.
    if (relevantEntries.length > 0) {
      let augmentedContext = "Before you respond to the user's last message, here is some relevant context from their private journal entries:\n\n";
      relevantEntries.forEach(entry => {
        augmentedContext += `On ${new Date(entry.created_at).toLocaleDateString()}:\n"${entry.content.substring(0, 150)}..."\n\n`;
      });
      augmentedContext += "Now, please answer the user's last message using this context as your long-term memory.";
      
      // Add this "context" as a "model" (AI) message, to "brief" the AI.
      geminiHistory.push({ role: 'model', parts: [{ text: augmentedContext }] });
    }

    // Add the user's NEW message at the very end.
    geminiHistory.push({ role: 'user', parts: [{ text: message }] });


    // 5. Define the System Prompt
    const systemPrompt = `You are 'Mindwell,' a supportive AI companion... (rest of your prompt) ... If the user's text seems potentially related to self-harm or crisis, ONLY respond with the exact text: CRISIS_DETECTED`;

    // 6. Prepare the payload for the Gemini API
    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiHistory, // Send the FULL, *augmented* history
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        // ... (other safety settings)
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    };

    // 7. Call the Gemini API (with retry logic)
    let aiResponseText = '';
    // ... (Your existing fetch/retry logic goes here) ...
    // ... (This block remains unchanged from the previous version) ...
    let attempt = 0;
    const maxAttempts = 5;
    let delay = 1000;

    while (attempt < maxAttempts) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          if (response.status === 429 || response.status >= 500) {
            console.warn(`Gemini API request failed... Retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            attempt++;
            continue;
          } else {
            throw new Error(`Gemini API request failed`);
          }
        }
        const result = await response.json();
        const finishReason = result.candidates?.[0]?.finishReason;

        if (finishReason === 'SAFETY') {
            aiResponseText = "I'm not able to respond to that due to my safety guidelines.";
        } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            aiResponseText = result.candidates[0].content.parts[0].text;
        } else {
            console.error('Unexpected Gemini API response structure:', result);
            aiResponseText = "Sorry, I'm having trouble connecting right now.";
        }
        if (aiResponseText.trim() === 'CRISIS_DETECTED') {
            return res.status(200).json({ reply: "It sounds like you're going through a very difficult time... [Crisis Resources]", isCrisis: true });
        }
        break;
      } catch (error) {
         if (attempt >= maxAttempts - 1) {
             return res.status(500).json({ error: 'Failed to get AI feedback.' });
         }
         console.warn(`Gemini API request failed... Retrying...`);
         await new Promise(resolve => setTimeout(resolve, delay));
         delay *= 2;
         attempt++;
      }
    }
    if (!aiResponseText && attempt >= maxAttempts) {
       return res.status(500).json({ error: 'Failed to get AI feedback.' });
    }

    // 8. Save the *actual* conversation turn to the database.
    // We do NOT save our augmented prompt. We only save the user's message
    // and the AI's final answer. This keeps the chat log clean.
    const newHistory = [
      ...savedChatHistory,
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: aiResponseText }] }
    ];

    const updateHistoryQuery = `UPDATE users SET chat_history = $1 WHERE user_id = $2;`;
    await pool.query(updateHistoryQuery, [JSON.stringify(newHistory), userId]);

    // 9. Send only the new reply back to the user
    res.status(200).json({ reply: aiResponseText });

  } catch (error) {
    console.error('Error in handleChat:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


module.exports = {
  getChatHistory,
  handleChat,
};
