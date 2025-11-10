// Import the database connection pool
const pool = require('../db');

/**
 * Fetches the user's entire chat history.
 * This is called when the user first loads the chat page
 * to populate the conversation "memory".
 * (Protected Route)
 */
const getChatHistory = async (req, res) => {
  try {
    // 1. Get the user ID from the authentication middleware (ensures user is logged in)
    const userId = req.user.userId;

    // 2. Fetch the user's chat_history from the 'users' table
    const historyQuery = 'SELECT chat_history FROM users WHERE user_id = $1';
    const historyResult = await pool.query(historyQuery, [userId]);
    
    // 3. Get the history. If it's NULL (a new user or first-time chat),
    // default to an empty array []. This is crucial for the frontend.
    const savedChatHistory = historyResult.rows[0]?.chat_history || [];

    // 4. Send the array of past messages
    res.status(200).json(savedChatHistory);

  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Handles a new message in a multi-turn conversational chat with the AI.
 * This is the main "chat" function.
 * (Protected Route)
 */
const handleChat = async (req, res) => {
  try {
    // 1. Get user ID from auth and the new message from the request body
    const userId = req.user.userId;
    const { message } = req.body; // The new message from the user

    // 2. Validate the input
    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // 3. Fetch the user's *existing* chat history from the 'users' table
    const historyQuery = 'SELECT chat_history FROM users WHERE user_id = $1';
    const historyResult = await pool.query(historyQuery, [userId]);
    const savedChatHistory = historyResult.rows[0]?.chat_history || [];

    // 4. Build the full conversation history to send to Gemini
    // This is how we create the "illusion of memory".
    const geminiHistory = [
      ...savedChatHistory, // Add all old messages
      { role: 'user', parts: [{ text: message }] } // Add the user's NEW message
    ];

    // 5. Define the System Prompt (The AI's "Personality" and "Rules")
    const systemPrompt = `You are 'Mindwell,' a supportive and empathetic AI companion. Your goal is to help users reflect on their thoughts and feelings in a safe, general, and constructive conversation.
Your rules are:
1.  Always be supportive, empathetic, and non-judgmental.
2.  Do NOT give medical advice or act like a licensed therapist. You are a companion, not a clinician.
3.  You can ask gentle, open-ended questions to continue the conversation, but do not be pushy.
4.  Keep your responses conversational and natural.
5.  If the user asks about a past topic, you can use the conversation history to "remember" it.
6.  If the user's text seems potentially related to self-harm or crisis, ONLY respond with the exact text: CRISIS_DETECTED`;

    // 6. Prepare the payload for the Gemini API
    const apiKey = process.env.GEMINI_API_KEY || "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiHistory, // We send the *entire* conversation history
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    };

    // 7. Call the Gemini API (with robust retry logic for network/server errors)
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
          // If it's a temporary error (like 429 Too Many Requests or 500 Server Error), wait and try again
          if (response.status === 429 || response.status >= 500) {
            console.warn(`Gemini API request failed (attempt ${attempt + 1}): Status ${response.status}. Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            attempt++;
            continue; // Retry the loop
          } else {
            // If it's a permanent error (like 400 Bad Request), stop trying
            const errorBody = await response.json();
            console.error('Gemini API Error:', response.status, errorBody);
            throw new Error(`Gemini API request failed with status ${response.status}`);
          }
        }

        // 8. The "Safety Gate": Process the successful response
        const result = await response.json();
        const finishReason = result.candidates?.[0]?.finishReason;

        if (finishReason === 'SAFETY') {
            // Blocked by Google's built-in safety filters
            aiResponseText = "I'm not able to respond to that due to my safety guidelines. Could we talk about something else?";
        } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            // The "happy path" - we got a successful response
            aiResponseText = result.candidates[0].content.parts[0].text;
        } else {
            // The response was not in the expected format (e.g., MAX_TOKENS hit)
            console.error('Unexpected Gemini API response structure:', finishReason, result);
            aiResponseText = "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
        }

        // 9. Our *Custom* Safety Check (for our system prompt's rule)
        if (aiResponseText.trim() === 'CRISIS_DETECTED') {
            // Do NOT save this response. Just return the crisis message.
            return res.status(200).json({ 
              reply: "It sounds like you're going through a very difficult time. Please reach out for support. You can contact the National Suicide Prevention Lifeline at 988. You are not alone.", 
              isCrisis: true 
            });
        }
        
        break; // Success! Exit the retry loop.

      } catch (error) {
         // This block catches network errors or the error we threw from the 'else' block
         if (attempt >= maxAttempts - 1) {
             console.error('Failed to get AI feedback after multiple retries:', error);
             return res.status(500).json({ error: 'Failed to get AI feedback. Please try again later.' });
         }
         console.warn(`Gemini API request failed (attempt ${attempt + 1}): ${error.message}. Retrying in ${delay / 1000}s...`);
         await new Promise(resolve => setTimeout(resolve, delay));
         delay *= 2;
         attempt++;
      }
    }
    
    // Safety net in case the loop finishes without a response
    if (!aiResponseText && attempt >= maxAttempts) {
       return res.status(500).json({ error: 'Failed to get AI feedback after multiple attempts.' });
    }

    // 10. **Save the Conversation!** This is the "memory" part.
    // We create a new history array that includes this latest exchange.
    const newHistory = [
      ...savedChatHistory, // All the old messages
      { role: 'user', parts: [{ text: message }] }, // The user's new message
      { role: 'model', parts: [{ text: aiResponseText }] } // The AI's new reply
    ];

    // 11. Update the 'users' table with the complete new history
    const updateHistoryQuery = `
      UPDATE users SET chat_history = $1 WHERE user_id = $2;
    `;
    // We must stringify the array to store it in the JSONB column
    await pool.query(updateHistoryQuery, [JSON.stringify(newHistory), userId]);

    // 12. Send *only the new reply* back to the frontend
    res.status(200).json({ reply: aiResponseText });

  } catch (error) {
    // This is the final catch block for any unexpected errors
    console.error('Error in handleChat:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Export both functions to be used by the router
module.exports = {
  getChatHistory,
  handleChat,
};