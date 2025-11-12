const pool = require('../db');

/**
 * [HELPER] Searches the user's private journals for relevant keywords.
 * This is the "R" (Retrieval) in RAG.
 */
const searchJournals = async (userId, userMessage) => {
  try {
    // A simple keyword extractor. We'll ignore common, small "stop words".
    const stopWords = ['a', 'an', 'the', 'is', 'in', 'on', 'what', 'my', 'i', 'me', 'about', 'ever', 'have', 'feel', 'feeling', 'did', 'am', 'was'];
    const keywords = userMessage.toLowerCase()
      .replace(/[?,.]/g, '') // Remove punctuation
      .split(' ')
      .filter(word => word.length > 3 && !stopWords.includes(word)); // Find significant keywords

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
    console.log(`[RAG] Found ${searchResult.rowCount} relevant journal entries.`);
    return searchResult.rows;

  } catch (error) {
    console.error('[RAG] Error searching journals:', error);
    return []; // Return empty on error, so chat can continue
  }
};

/**
 * [HELPER] Generates and saves a title for a new conversation in the background.
 */
const generateAndSaveTitle = async (conversationId, userMessage, botMessage) => {
  try {
    console.log(`[Title Gen] Starting for conversation ${conversationId}`);
    
    const titleGenPrompt = `
      Summarize the following conversation in 3-5 words. 
      Do NOT use quotes.
      
      User: "${userMessage}"
      Assistant: "${botMessage}"
      
      Summary:
    `;

    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: titleGenPrompt }] }],
      generationConfig: { maxOutputTokens: 10 },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Title generation API failed');
    
    const result = await response.json();
    let title = result.candidates?.[0]?.content?.parts?.[0]?.text.trim() || 'New Chat';
    
    title = title.replace(/["*]/g, ''); // Clean up title

    await pool.query(
      'UPDATE chat_conversations SET title = $1 WHERE id = $2',
      [title, conversationId]
    );
    
    console.log(`[Title Gen] Success. Title set to: "${title}"`);

  } catch (error) {
    console.error(`[Title Gen] Failed for ${conversationId}:`, error);
  }
};

/**
 * ===================================================================
 * 1. Fetches all of a user's conversations for the sidebar.
 * ===================================================================
 */
const getAllConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const query = `
      SELECT id, title, created_at 
      FROM chat_conversations 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * ===================================================================
 * 2. Fetches all messages for a specific conversation.
 * ===================================================================
 */
const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: conversationId } = req.params;

    // Security: Verify this user owns this conversation
    const ownerCheck = await pool.query(
      'SELECT 1 FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    if (ownerCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch all messages for this chat
    const query = `
      SELECT role, content 
      FROM chat_messages 
      WHERE conversation_id = $1 
      ORDER BY id ASC
    `;
    const result = await pool.query(query, [conversationId]);
    
    // Format for frontend (assuming 'content' is JSONB/JSON)
    const frontendHistory = result.rows.map(msg => {
      // The 'content' column stores the Gemini .parts array, e.g., [{ "text": "Hello" }]
      // We extract the text for the frontend.
      const contentText = msg.content?.[0]?.text || '';
      return { 
        role: msg.role === 'model' ? 'assistant' : 'user', 
        content: contentText 
      };
    });

    res.status(200).json(frontendHistory);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * ===================================================================
 * 3. Creates a new conversation *and* processes the first message.
 * ===================================================================
 */
const createNewChat = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;
    const { message } = req.body; 
    if (!message) return res.status(400).json({ error: 'Message content is required.' });

    await client.query('BEGIN');

    // 1. Create a new conversation entry
    const createConvQuery = `
      INSERT INTO chat_conversations (user_id) VALUES ($1) 
      RETURNING id, title, created_at
    `;
    const result = await client.query(createConvQuery, [userId]);
    const newConversation = result.rows[0];
    const conversationId = newConversation.id;

    // 2. Format user message in Gemini's format
    const userMessageGemini = { role: 'user', parts: [{ text: message }] };
    
    // 3. Define System Prompt
    const systemPrompt = `You are 'Mindwell,' a supportive AI companion... (rest of your system prompt)... If the user's text seems potentially related to self-harm or crisis, ONLY respond with the exact text: CRISIS_DETECTED`;
    
    // 4. Prepare payload for Gemini (only the system prompt + first user message)
    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [userMessageGemini], 
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ],
      generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
    };
    
    // 5. Call Gemini API (with retry logic)
    // (A full retry loop is recommended here, simplified for brevity)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.error('Gemini API Error in createNewChat:', await response.json());
      throw new Error('Gemini API failed');
    }
    const geminiResult = await response.json();
    let aiResponseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I'm having trouble right now.";

    // (Add your safety/crisis check here)
    if (aiResponseText.trim() === 'CRISIS_DETECTED') {
      aiResponseText = "It sounds like you're going through a very difficult time... [Crisis Resources]";
    }

    // 6. Save both messages to the database
    const aiMessageGemini = { role: 'model', parts: [{ text: aiResponseText }] };
    const saveMsgQuery = 'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)';
    
    // Save user message (assuming 'content' is JSONB)
    await client.query(saveMsgQuery, [conversationId, userMessageGemini.role, JSON.stringify(userMessageGemini.parts)]);
    // Save AI reply (assuming 'content' is JSONB)
    await client.query(saveMsgQuery, [conversationId, aiMessageGemini.role, JSON.stringify(aiMessageGemini.parts)]);

    // 7. Commit transaction
    await client.query('COMMIT');
    
    // 8. Send back the *new conversation* so the frontend can redirect
    res.status(201).json(newConversation);

    // 9. Generate a title in the background (fire and forget)
    generateAndSaveTitle(conversationId, message, aiResponseText).catch(err => {
      console.error('Background title generation failed:', err);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating new chat:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

/**
 * ===================================================================
 * 4. Handles a new message in an *existing* conversation.
 * --- THIS IS THE UPGRADED RAG-ENABLED FUNCTION ---
 * ===================================================================
 */
const handleChat = async (req, res) => {
  const client = await pool.connect(); 
  try {
    const userId = req.user.userId;
    const { id: conversationId } = req.params;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message content is required.' });

    // 1. Verify user owns this conversation
    const ownerCheck = await client.query(
      'SELECT 1 FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    if (ownerCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await client.query('BEGIN');

    // 2. Get existing messages from DB (Gemini format)
    const historyQuery = `
      SELECT role, content 
      FROM chat_messages 
      WHERE conversation_id = $1 
      ORDER BY id ASC
    `;
    const historyResult = await client.query(historyQuery, [conversationId]);
    
    // We assume 'content' is JSONB and stores the .parts array, e.g., [{"text": "Hello"}]
    const geminiHistory = historyResult.rows.map(msg => ({
      role: msg.role,
      parts: msg.content
    }));

    // 3. --- NEW "AGENT" LOGIC: Detect if this is a memory question ---
    let relevantEntries = [];
    const memoryKeywords = ['remember', 'in my journal', 'have i ever', 'tell me about', 'my past', 'what did i say about', 'anxious'];
    const isMemoryQuestion = memoryKeywords.some(kw => message.toLowerCase().includes(kw));

    if (isMemoryQuestion) {
      // 4. --- RETRIEVAL ---
      // If it is, search the user's journals for relevant context.
      relevantEntries = await searchJournals(userId, message);
    }

    // 5. --- AUGMENTATION ---
    // If we found relevant entries, "augment" the context.
    if (relevantEntries.length > 0) {
      let augmentedContext = "Before you respond to the user's last message, here is some relevant context from their private journal entries:\n\n";
      relevantEntries.forEach(entry => {
        augmentedContext += `On ${new Date(entry.created_at).toLocaleDateString()}:\n"${entry.content.substring(0, 150)}..."\n\n`;
      });
      augmentedContext += "Now, please answer the user's last message *using this context*. If you use this context, briefly mention that you found it in their journal (e.g., 'I found an entry from...').";
      
      // Add this "context" as a "model" (AI) message, to "brief" the AI.
      geminiHistory.push({ role: 'model', parts: [{ text: augmentedContext }] });
    }

    // 6. Add the new user message (in Gemini format) at the very end
    const userMessageGemini = { role: 'user', parts: [{ text: message }] };
    geminiHistory.push(userMessageGemini);

    // 7. Prune history if it's too long (Context Window Management)
    const MAX_MESSAGES_TO_SEND = 20; // Keep first + last 20
    let historyForGemini = geminiHistory;
    if (geminiHistory.length > MAX_MESSAGES_TO_SEND) {
      historyForGemini = [
        geminiHistory[0], // Always keep the first message
        ...geminiHistory.slice(-MAX_MESSAGES_TO_SEND) // And the last 20
      ];
    }
    
    // 8. Define System Prompt
    const systemPrompt = `You are 'Mindwell,' a supportive AI companion... (rest of your system prompt)... If the user's text seems potentially related to self-harm or crisis, ONLY respond with the exact text: CRISIS_DETECTED`;

    // 9. Prepare payload for Gemini
    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: historyForGemini, // Use the pruned history
      safetySettings: [ /* ... your safety settings ... */ ],
      generationConfig: { /* ... your generation config ... */ },
    };

    // 10. Call Gemini API (Add your retry loop here for production)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.error('Gemini API Error in handleChat:', await response.json());
      throw new Error('Gemini API failed');
    }
    
    const geminiResult = await response.json();
    let aiResponseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I'm having trouble connecting right now.";
    
    // 11. Safety/Crisis Check
    if (aiResponseText.trim() === 'CRISIS_DETECTED') {
      aiResponseText = "It sounds like you're going through a very difficult time... [Crisis Resources]";
      // Send the reply, but do NOT save this turn to history (or save a redacted version)
      await client.query('ROLLBACK'); // Don't save this turn
      return res.status(200).json({ role: 'assistant', content: aiResponseText, isCrisis: true });
    }

    // 12. Save the *actual* conversation turn to the database
    // (We save the user message and the final AI reply, NOT the augmented context)
    const aiMessageGemini = { role: 'model', parts: [{ text: aiResponseText }] };
    const saveMsgQuery = 'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)';
    
    // Save user message (assuming 'content' is JSONB)
    await client.query(saveMsgQuery, [conversationId, userMessageGemini.role, JSON.stringify(userMessageGemini.parts)]);
    // Save AI reply (assuming 'content' is JSONB)
    await client.query(saveMsgQuery, [conversationId, aiMessageGemini.role, JSON.stringify(aiMessageGemini.parts)]);
    
    await client.query('COMMIT');

    // 13. Send *only the new reply* back to the user
    res.status(200).json({ role: 'assistant', content: aiResponseText });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in handleChat:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

/**
 * ===================================================================
 * 5. Deletes a specific conversation and all its messages.
 * ===================================================================
 */
const deleteConversation = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;
    const { id: conversationId } = req.params;

    await client.query('BEGIN');

    // Verify this user owns this conversation
    const ownerCheck = await client.query(
      'SELECT 1 FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    if (ownerCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete the conversation (messages will be deleted due to ON DELETE CASCADE)
    await client.query(
      'DELETE FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    
    await client.query('COMMIT');
    
    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
};


/**
 * ===================================================================
 * 6. MODULE EXPORTS
 * ===================================================================
 */
module.exports = {
  getAllConversations,
  getConversationMessages,
  createNewChat,
  handleChat,
  deleteConversation
};