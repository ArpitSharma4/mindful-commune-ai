const pool = require('../db');

/**
 * Generates and saves a title for a conversation based on the first message
 */
const generateAndSaveTitle = async (conversationId, userMessage, botMessage) => {
  try {
    console.log(`[Title Gen] Starting for conversation ${conversationId}`);
    
    // 1. Create a prompt for the AI to summarize the chat
    const titleGenPrompt = `
      Summarize the following conversation in 3-5 words. 
      Do NOT use quotes.
      
      User: "${userMessage}"
      Assistant: "${botMessage}"
      
      Summary:
    `;

    // 2. Prepare payload for Gemini (using a fast model)
    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: titleGenPrompt }] }],
      generationConfig: { maxOutputTokens: 10 },
    };

    // 3. Call Gemini API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Title generation API failed');
    
    const result = await response.json();
    let title = result.candidates?.[0]?.content?.parts?.[0]?.text.trim() || 'New Chat';
    
    // Clean up the title (remove quotes/asterisks)
    title = title.replace(/["*]/g, '');

    // 4. Update the title in the database
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

    // ... (Your ownerCheck logic) ...
    const ownerCheck = await pool.query(
      'SELECT 1 FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    if (ownerCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const query = `
      SELECT role, content 
      FROM chat_messages 
      WHERE conversation_id = $1 
      ORDER BY id ASC
    `;
    const result = await pool.query(query, [conversationId]);
    
    // --- THIS IS THE FIX ---
    const frontendHistory = result.rows.map(msg => {
      const role = msg.role === 'model' ? 'assistant' : 'user';
      let parts = msg.content;
      
      // Check if 'content' is a string (the bug)
      if (typeof parts === 'string') {
        try {
          parts = JSON.parse(parts); // Turn the string back into an array
        } catch (e) {
          parts = []; // Bad data
        }
      }
      
      const content = parts[0]?.text || '';
      return { role, content };
    });
    // --- END OF FIX ---

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

    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    await client.query('BEGIN');

    // 1. Create a new conversation
    const createConvQuery = `
      INSERT INTO chat_conversations (user_id) 
      VALUES ($1) 
      RETURNING id, title, created_at
    `;
    const result = await client.query(createConvQuery, [userId]);
    const newConversation = result.rows[0];
    const conversationId = newConversation.id;

    // 2. Now, process this first message
    const userMessageGemini = { role: 'user', parts: [{ text: message }] };
    const saveUserMsgQuery = 'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)';
    
    // --- FIX 1: REMOVED JSON.stringify() ---
    await client.query(saveUserMsgQuery, [conversationId, userMessageGemini.role, JSON.stringify(userMessageGemini.parts)]);
// ...
    // 2b. Prepare for Gemini
    // ... (rest of your Gemini payload logic) ...
    const systemPrompt = `You are 'Mindwell,' a supportive AI companion... (rest of your system prompt)`;
    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [userMessageGemini], 
      safetySettings: [ /* ... your safety settings ... */ ],
      generationConfig: { /* ... your generation config ... */ },
    };
    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    // 2c. Call Gemini API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Gemini API failed');
    const geminiResult = await response.json();
    const aiResponseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I'm having trouble right now.";
    // (Add your safety/crisis check here)

    // 2d. Save the Bot's reply
    const aiMessageGemini = { role: 'model', parts: [{ text: aiResponseText }] };
    const saveBotMsgQuery = 'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)';

    // --- FIX 2: REMOVED JSON.stringify() ---
    await client.query(saveBotMsgQuery, [conversationId, aiMessageGemini.role, JSON.stringify(aiMessageGemini.parts)]);

    // 3. Commit transaction
    await client.query('COMMIT');
    
    // 4. Send back the *new conversation* so the frontend can redirect
    res.status(201).json(newConversation);

    // 5. Generate a title in the background
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
 * 4. Handles a new message in an existing conversation.
 * ===================================================================
 */
const handleChat = async (req, res) => {
  const client = await pool.connect(); 
  try {
    const userId = req.user.userId;
    const { id: conversationId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // 1. Verify user owns this conversation
    // ... (your ownerCheck logic) ...
    const ownerCheck = await pool.query(
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
    
    const geminiHistory = historyResult.rows.map(msg => ({
      role: msg.role,
      parts: msg.content // We stored the .parts array, so we read it
    }));

    // 3. Add the new user message (in Gemini format)
    const userMessageGemini = { role: 'user', parts: [{ text: message }] };
    geminiHistory.push(userMessageGemini);
    
    // 4. (RAG Logic) ...
    
    // 5. Define System Prompt
    const systemPrompt = `You are 'Mindwell,' a supportive AI companion... (rest of your system prompt)`;

    // 6. Prepare payload for Gemini
    // ... (your payload logic) ...
    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiHistory,
      safetySettings: [ /* ... your safety settings ... */ ],
      generationConfig: { /* ... your generation config ... */ },
    };

    // 7. Check if this is the first message in the conversation
    const messageCount = await client.query(
      'SELECT COUNT(*) FROM chat_messages WHERE conversation_id = $1',
      [conversationId]
    );
    const isFirstMessage = parseInt(messageCount.rows[0].count) === 0;

    // 8. Call Gemini API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Gemini API failed');
    
    const geminiResult = await response.json();
    let aiResponseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I'm having trouble connecting right now.";
    // ... (your crisis/safety check) ...
    if (aiResponseText.trim() === 'CRISIS_DETECTED') {
      return res.status(200).json({ 
        role: 'assistant', 
        content: "It sounds like you're going through a very difficult time..." // (Your crisis message)
      });
    }

    // 8. Save messages to new database table
    const aiMessageGemini = { role: 'model', parts: [{ text: aiResponseText }] };
    
    const query = 'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)';
    
    // --- FIX 3: Manually stringify the JSON ---
    await client.query(query, [conversationId, userMessageGemini.role, JSON.stringify(userMessageGemini.parts)]);
// ...
await client.query(query, [conversationId, aiMessageGemini.role, JSON.stringify(aiMessageGemini.parts)]);
    
    await client.query('COMMIT');

    // 9. Send *only the new reply* back to the user
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
 * 5. MODULE EXPORTS
 * ===================================================================
 */
/**
 * Deletes a specific conversation and all its messages.
 */
const deleteConversation = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.userId;
    const { id: conversationId } = req.params;

    // Verify this user owns this conversation
    const ownerCheck = await client.query(
      'SELECT 1 FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    
    if (ownerCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete the conversation (messages will be deleted due to ON DELETE CASCADE)
    await client.query('BEGIN');
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

module.exports = {
  getAllConversations,
  createNewChat,
  getConversationMessages,
  handleChat,
  deleteConversation
};