// --- Module Imports ---
// Import the necessary core libraries for the server.
const express = require('express'); // The main framework for building the web server.
const cors = require('cors');       // Middleware to handle Cross-Origin Resource Sharing, allowing your frontend to communicate with this backend.
require('dotenv').config();         // Loads environment variables from a .env file into process.env.
const path = require('path');       // A built-in Node.js module for working with file and directory paths.
const fs = require('fs');           // A built-in Node.js module for interacting with the file system.

// --- Top-Level Router Imports ---
// Import the router files for each major feature/resource in the application.
const userRoutes = require('./users/users.route');
const communityRoutes = require('./community/community.route');
const postRoutes = require('./posts/posts.route');
const journalRoutes = require('./journal/journal.route'); // <-- Added the new journal router
const supportRoutes = require('./support/support.route'); // This was in your file, kept for consistency.


// --- Application Initialization ---
// Create an instance of the Express application. This 'app' object will be used to configure the server.
const app = express();
const PORT = process.env.PORT || 3000; // Use the port from the .env file, or default to 3000.


// --- Global Middleware Configuration ---

// Configure CORS (Cross-Origin Resource Sharing)
// This is a security feature that controls which external domains are allowed to make requests to your API.
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173', 'http://127.0.0.1:8080'], // Whitelist of frontend origins.
  credentials: true, // Allows cookies and authorization headers to be sent from the frontend.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods.
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed request headers.
}));

// Configure JSON Body Parser
// This middleware is crucial. It parses incoming requests with JSON payloads (e.g., from Postman or a frontend form).
// It makes the parsed data available on `req.body`.
app.use(express.json());


// --- Static File Serving ---
// This section makes files in a specific directory on the server accessible via a URL.

// First, ensure the 'uploads' directory exists. If not, create it.
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
// This middleware tells Express that any request starting with '/uploads' should
// serve a static file from the './uploads' directory. This is how images and videos will be displayed.
app.use('/uploads', express.static(uploadsDir));


// --- Main API Routes ---
// This is where the application's API endpoints are defined.
// The server delegates requests to the appropriate router based on the URL prefix.
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/journal', journalRoutes); // <-- Added the new journal route
app.use('/api/support', supportRoutes);


// --- Error Handling & Final Middleware ---

// Global Error Handling Middleware
// This special middleware with four arguments will catch any unhandled errors that occur in the route handlers above.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Root Route
// A simple health check endpoint to confirm that the server is running.
app.get('/', (req, res) => {
  res.json({
    message: 'Mindful Commune AI Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 Not Found Handler
// This middleware runs if no other route has matched the request URL. It sends a 404 error.
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});


// --- Server Startup ---
// Start the server and make it listen for incoming requests on the configured port.
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});

