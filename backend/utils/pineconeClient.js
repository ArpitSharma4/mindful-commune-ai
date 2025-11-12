// This file initializes and exports the Pinecone client and the specific index we'll be using.

const { Pinecone } = require('@pinecone-database/pinecone');

// 1. Get Pinecone credentials from environment variables
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX_NAME;

if (!pineconeApiKey || !pineconeIndexName) {
  console.warn(
    'Pinecone API key or index name is not set in .env file. ' +
    'Pinecone-related features (RAG chat) will be disabled.'
  );
}

// 2. Initialize the Pinecone client
const pinecone = new Pinecone({
  apiKey: pineconeApiKey,
});

// 3. Select the specific index we created in the Pinecone dashboard
// We will use this index object in our controllers to query and upsert.
const pineconeIndex = pinecone.index(pineconeIndexName);

// 4. Export the initialized index
module.exports = {
  pineconeIndex,
};