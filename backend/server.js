// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// --- Top-Level Routers ---
const userRoutes = require('./users/users.route');
const communityRoutes = require('./community/community.route');
const postRoutes = require('./posts/posts.route'); // <-- Only import the main parent router

// ... (rest of your initial setup code) ...

const app = express();
const PORT = process.env.PORT || 3000;

// ... (CORS and express.json() middleware) ...
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


// --- Static File Serving ---
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
app.use('/uploads', express.static(uploadsDir));

// --- Main Routes ---
// This section should only contain your top-level routes.
app.use('/api/users', userRoutes);
app.use('/api/community', communityRoutes); // Note: You probably mean /api/communities
app.use('/api/posts', postRoutes);

// ... (rest of your error handling and app.listen code) ...
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});
app.get('/', (req, res) => {
  res.json({
    message: 'Mindful Commune AI Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});

