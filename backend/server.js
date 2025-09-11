// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const userRoutes = require('./users/users.route');
const communityRoutes = require('./community/community.route');

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Create the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - Allow requests from frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse incoming JSON requests
// This allows us to access `req.body` in our controllers
app.use(express.json());

// --- Main Routes ---
// Any request starting with '/api/users' will be handled by our userRoutes file.
app.use('/api/users', userRoutes);

// Any request starting with '/api/communities' will be handled by our communityRoutes file.
app.use('/api/communities', communityRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// A simple root route to check if the server is running
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mindful Commune AI Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for frontend development`);
});
