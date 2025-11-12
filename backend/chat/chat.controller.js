const pool = require('../db');
// Import our new AI/DB helpers
const { pineconeIndex } = require('../utils/pineconeClient');
const { generateEmbedding } = require('../utils/aiHelpers');

/**
 * ===================================================================
 * HELPER FUNCTIONS
 * ===================================================================
 */

/**
 * [HELPER] Performs a semantic (vector) search on the user's journals.
 * This is the "R" (Retrieval) in RAG.
 */
const semanticSearchJournals = async (userId, userMessage) => {
  try {
    // 1. Create an embedding (a vector) for the user's *question*.
    const queryVector = await generateEmbedding(userMessage);

    // 2. Define our relevance threshold. We tune this to get good matches.
    // 0.70 is a good balance, less strict than 0.75.
    const SIMILARITY_THRESHOLD = 0.50; 

    // 3. Query Pinecone for the top 3 most similar vectors
    const queryResponse = await pineconeIndex.query({
      vector: queryVector,
      topK: 3,
      // **CRITICAL SECURITY FILTER**: Only search for vectors
      // that belong to the currently logged-in user.
      filter: {
        userId: { '$eq': userId }
      },
      // Scores are returned by default
    });

    // 4. Filter the results by our threshold
    const relevantMatches = queryResponse.matches.filter(
      match => match.score >= SIMILARITY_THRESHOLD
    );

    // 5. Get the list of entry IDs from the relevant matches
    const entryIds = relevantMatches.map(match => match.id);

    if (entryIds.length === 0) {
      console.log(`[RAG] Found ${queryResponse.matches.length} matches, but 0 were above the ${SIMILARITY_THRESHOLD} threshold.`);
      return []; // Return an empty array
    }
    
    // 6. Use the relevant IDs to fetch the *actual text* from our Postgres database
    const searchQuery = `
      SELECT content, created_at
      FROM journal_entries
      WHERE entry_id = ANY($1::uuid[])
      ORDER BY created_at DESC;
    `;
    
    const searchResult = await pool.query(searchQuery, [entryIds]);
    console.log(`[RAG] Found ${searchResult.rowCount} relevant & high-quality entries from Postgres.`);
    return searchResult.rows;

  } catch (error) {
    console.error('[RAG] Error in semantic search:', error);
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
      Summarize the following conversation in 2 words. 
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
    
    // Format for frontend (assuming 'content' is JSONB, 'pg' driver auto-parses it)
    const frontendHistory = result.rows.map(msg => {
      // 'msg.content' is already a JS array like [{ "text": "Hello" }]
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

    // 2. Start building the Gemini history.
    const geminiHistory = [];

    // 3. --- RAG LOGIC ---
    // We now perform a RAG search on the *very first message*.
    console.log(`[RAG] Performing semantic search for new chat...`);
    const relevantEntries = await semanticSearchJournals(userId, message);
    
    if (isMemoryQuestion) {
      console.log(`[RAG] Detected memory question in NEW chat. Performing semantic search...`);
      relevantEntries = await semanticSearchJournals(userId, message);
    }

    // 5. --- AUGMENTATION ---
    if (relevantEntries.length > 0) {
      let augmentedContext = "Before you respond to the user's last message, here is some relevant context from their private journal entries:\n\n";
      relevantEntries.forEach(entry => {
        augmentedContext += `On ${new Date(entry.created_at).toLocaleDateString()}:\n"${entry.content.substring(0, 150)}..."\n\n`;
      });
      augmentedContext += "Now, please answer the user's last message *using this context*. If you use this context, briefly mention that you found it in their journal but dont mention date until asked for.";
      
      geminiHistory.push({ role: 'model', parts: [{ text: augmentedContext }] });
    }
    // --- [END OF RAG LOGIC] ---

    // 6. Add the new user message (in Gemini format)
    const userMessageGemini = { role: 'user', parts: [{ text: message }] };
    geminiHistory.push(userMessageGemini);
    
    // 7. Define System Prompt
    const systemPrompt = `You are 'Mindwell,' a supportive and empathetic AI companion. Your goal is to hold a natural, supportive, and helpful conversation.

YOUR RULES:
1.  **Use Markdown formatting** (like **bold**, *italics*, and bulleted lists) to make your responses clear and easy to read.
2.  **Be conversational.** Ask follow-up questions when it feels natural, to encourage the user to explore their thoughts.
3.  **Always be supportive and non-judgmental.**
4.  **Do NOT give medical advice or act like a licensed therapist.** You are a companion, not a clinician.
5.  If the user's text seems potentially related to self-harm or crisis, ONLY respond with the exact text: CRISIS_DETECTED`;
    
    // 8. Prepare payload for Gemini
    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiHistory, // Send the (potentially augmented) history
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ],
      generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
    };
    
    // 9. --- [FIXED] Call Gemini API (with full retry logic) ---
    let aiResponseText = '';
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
            console.warn(`[createNewChat] Gemini API failed... Retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            attempt++;
            continue;
          } else {
            console.error('Gemini API Error in createNewChat:', await response.json());
            throw new Error(`Gemini API failed with status ${response.status}`);
          }
        }
        const geminiResult = await response.json();
        const finishReason = geminiResult.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          aiResponseText = "I'm not able to respond to that due to my safety guidelines.";
        } else if (geminiResult.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiResponseText = geminiResult.candidates[0].content.parts[0].text;
        } else {
          console.error('Unexpected Gemini API response structure:', geminiResult);
          aiResponseText = "Sorry, I'm having trouble connecting right now.";
        }
        break; 
      } catch (error) {
         if (attempt >= maxAttempts - 1) throw error;
         console.warn(`[createNewChat] Gemini API request failed... Retrying...`);
         await new Promise(resolve => setTimeout(resolve, delay));
         delay *= 2;
         attempt++;
      }
    }
    
    // 10. Safety/Crisis Check
    if (aiResponseText.trim() === 'CRISIS_DETECTED') {
      aiResponseText = "It sounds like you're going through a very difficult time. Please reach out for support. You can contact the National Suicide Prevention Lifeline at 988. You are not alone.";
    }

    // 11. Save both messages to the database
    const aiMessageGemini = { role: 'model', parts: [{ text: aiResponseText }] };
    const saveMsgQuery = 'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)';
    
    await client.query(saveMsgQuery, [conversationId, userMessageGemini.role, JSON.stringify(userMessageGemini.parts)]);
    await client.query(saveMsgQuery, [conversationId, aiMessageGemini.role, JSON.stringify(aiMessageGemini.parts)]);

    // 12. Commit transaction
    await client.query('COMMIT');
    
    // 13. Send back the *new conversation* so the frontend can redirect
    res.status(201).json(newConversation);

    // 14. Generate a title in the background (fire and forget)
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

    // 2. Get existing messages from DB
    const historyQuery = `
      SELECT role, content 
      FROM chat_messages 
      WHERE conversation_id = $1 
      ORDER BY id ASC
    `;
    const historyResult = await client.query(historyQuery, [conversationId]);
    
    // Assuming 'content' is JSONB, 'pg' driver auto-parses it
    const geminiHistory = historyResult.rows.map(msg => ({
      role: msg.role,
      parts: msg.content
    }));

    // 3. --- RAG LOGIC: Detect if this is a memory question ---
  // We *always* run the search now. No more keywords.
    console.log(`[RAG] Performing semantic search...`);
    const relevantEntries = await semanticSearchJournals(userId, message);

    // 5. --- AUGMENTATION ---
    if (relevantEntries.length > 0) {
      let augmentedContext = "Before you respond to the user's last message, here is some relevant context from their private journal entries:\n\n";
      relevantEntries.forEach(entry => {
        augmentedContext += `On ${new Date(entry.created_at).toLocaleDateString()}:\n"${entry.content.substring(0, 150)}..."\n\n`;
      });
      augmentedContext += "Now, please answer the user's last message *using this context*. If you use this context, briefly mention that you found it in their journal only mention date when asked for.";
      
      geminiHistory.push({ role: 'model', parts: [{ text: augmentedContext }] });
    }

    // 6. Add the new user message
    const userMessageGemini = { role: 'user', parts: [{ text: message }] };
    geminiHistory.push(userMessageGemini);

    // 7. Prune history
    const MAX_MESSAGES_TO_SEND = 20;
    let historyForGemini = geminiHistory;
    if (geminiHistory.length > MAX_MESSAGES_TO_SEND) {
      historyForGemini = [
        geminiHistory[0], 
        ...geminiHistory.slice(-MAX_MESSAGES_TO_SEND)
      ];
    }
    
    // 8. Define System Prompt
    const systemPrompt = `You are 'Mindwell,' a supportive and empathetic AI companion. Your goal is to hold a natural, supportive, and helpful conversation.

YOUR RULES:
1.  **Use Markdown formatting** (like **bold**, *italics*, and bulleted lists) to make your responses clear and easy to read.
2.  **Be conversational.** Ask follow-up questions when it feels natural, to encourage the user to explore their thoughts.
3.  **Always be supportive and non-judgmental.**
4.  **Do NOT give medical advice or act like a licensed therapist.** You are a companion, not a clinician.
5.  If the user's text seems potentially related to self-harm or crisis, ONLY respond with the exact text: CRISIS_DETECTED`;

    // 9. Prepare payload for Gemini
    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: historyForGemini,
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ],
      generationConfig: { 
        // maxOutputTokens: 1024, 
        temperature: 0.7 
      },
    };

    // 10. Call Gemini API (with retry loop)
    let aiResponseText = '';
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
            console.warn(`[handleChat] Gemini API failed... Retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            attempt++;
            continue;
          } else {
            console.error('Gemini API Error in handleChat:', await response.json());
            throw new Error(`Gemini API failed with status ${response.status}`);
          }
        }
        
        const geminiResult = await response.json();
        const finishReason = geminiResult.candidates?.[0]?.finishReason;

        if (finishReason === 'SAFETY') {
          aiResponseText = "I'm not able to respond to that due to my safety guidelines.";
        } else if (geminiResult.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiResponseText = geminiResult.candidates[0].content.parts[0].text;
        } else {
          console.error('Unexpected Gemini API response structure:', geminiResult);
          aiResponseText = "Sorry, I'm having trouble connecting right now.";
        }
        
        break; // Success
      } catch (error) {
         if (attempt >= maxAttempts - 1) {
             throw error; // Throw after max retries
         }
         console.warn(`[handleChat] Gemini API request failed... Retrying...`);
         await new Promise(resolve => setTimeout(resolve, delay));
         delay *= 2;
         attempt++;
      }
    }
    
    // 11. Safety/Crisis Check
    if (aiResponseText.trim() === 'CRISIS_DETECTED') {
      aiResponseText = "It sounds like you're going through a very difficult time. Please reach out for support. You can contact the National Suicide Prevention Lifeline at 988. You are not alone.";
      await client.query('ROLLBACK');
      return res.status(200).json({ role: 'assistant', content: aiResponseText, isCrisis: true });
    }

    // 12. Save the *actual* conversation turn to the database
    const aiMessageGemini = { role: 'model', parts: [{ text: aiResponseText }] };
    const saveMsgQuery = 'INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)';
    
    // We MUST stringify the array to store it in a TEXT or JSONB column
    await client.query(saveMsgQuery, [conversationId, userMessageGemini.role, JSON.stringify(userMessageGemini.parts)]);
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