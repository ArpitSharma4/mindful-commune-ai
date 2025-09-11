// backend/server.js
const express = require('express');
const userRoutes = require('./users/users.route');

// Create the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON requests
// This allows us to access `req.body` in our controllers
app.use(express.json());

// --- Main Routes ---
// Any request starting with '/api/users' will be handled by our userRoutes file.
app.use('/api/users', userRoutes);

// A simple root route to check if the server is running
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
