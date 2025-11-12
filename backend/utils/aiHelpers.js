// This file holds reusable, low-level functions for interacting with AI models.

/**
 * Generates a 768-dimension embedding for a given text string.
 * This function calls the Google 'text-embedding-004' model,
 * which is a different, specialized model from the chat model.
 *
 * @param {string} text The text to embed.
 * @returns {Promise<number[]>} A promise that resolves to an array of 768 numbers.
 */
const generateEmbedding = async (text) => {
  // 1. Get the API key and the specific model URL
  const apiKey = process.env.GEMINI_API_KEY || "";
  // Note: This is the 'embedContent' endpoint, NOT 'generateContent'
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

  // 2. Prepare the payload
  const payload = {
    model: "models/text-embedding-004", // Specify the embedding model
    content: {
      parts: [{ text: text }]
    }
  };

  // 3. Call the API (with retry logic)
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
          // Retry on server errors or rate limiting
          console.warn(`[Embedding] API request failed (attempt ${attempt + 1}): Status ${response.status}. Retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          attempt++;
          continue;
        } else {
          const errorBody = await response.json();
          console.error('[Embedding] API Error:', response.status, errorBody);
          throw new Error(`Gemini Embedding API request failed with status ${response.status}`);
        }
      }

      const result = await response.json();

      // 4. Extract the vector (the list of 768 numbers)
      if (result.embedding && result.embedding.values) {
        return result.embedding.values; // This is the array of numbers
      } else {
        console.error('[Embedding] Unexpected API response structure:', result);
        throw new Error('Failed to extract embedding from API response.');
      }

    } catch (error) {
      if (attempt >= maxAttempts - 1) {
        console.error('Failed to generate embedding after multiple retries:', error);
        throw error; // Re-throw the error to be caught by the controller
      }
      console.warn(`[Embedding] API request failed (attempt ${attempt + 1}): ${error.message}. Retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      attempt++;
    }
  }
};

module.exports = {
  generateEmbedding,
};