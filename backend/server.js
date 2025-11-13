// --- Module Imports ---
// Import the necessary core libraries for the server.
const express = require('express'); // The main framework for building the web server.
const cors = require('cors');       // Middleware to handle Cross-Origin Resource Sharing, allowing your frontend to communicate with this backend.
require('dotenv').config();         // Loads environment variables from a .env file into process.env.
const path = require('path');       // A built-in Node.js module for working with file and directory paths.
const fs = require('fs');           // A built-in Node.js module for interacting with the file system.
const session = require('express-session'); // Session middleware for Passport
const passport = require('passport'); // Passport.js for OAuth authentication
const GoogleStrategy = require('passport-google-oauth20').Strategy; // Google OAuth strategy
const AppleStrategy = require('passport-apple'); // Apple OAuth strategy
const jwt = require('jsonwebtoken'); // For generating JWT tokens
const pool = require('./db'); // Database connection
const chatRoutes = require('./chat/chat.route.js');
// In server.js
const gamificationRoutes = require('./gamification/gamification.route'); // Adjust path


// --- Top-Level Router Imports ---
// Import the router files for each major feature/resource in the application.
const userRoutes = require('./users/users.route');
const communityRoutes = require('./community/community.route');
const postRoutes = require('./posts/posts.route');
const journalRoutes = require('./journal/journal.route'); // <-- Added the new journal router
const supportRoutes = require('./support/support.route'); // This was in your file, kept for consistency.
// Note: OAuth routes will be defined inline below for easier setup



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
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'] // Allowed request headers.
}));

// Configure JSON Body Parser
// This middleware is crucial. It parses incoming requests with JSON payloads (e.g., from Postman or a frontend form).
// It makes the parsed data available on `req.body`.
app.use(express.json());

// Configure Session Middleware (required for Passport)
// This creates a session for each user to maintain authentication state during OAuth flow
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/support', supportRoutes);
app.use('/api/gamification', gamificationRoutes);

// --- Passport OAuth Configuration ---
// Configure Passport strategies for Google and Apple authentication

// Passport serialization - stores user ID in session
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

// Passport deserialization - retrieves user from database
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth profile:', profile.displayName);
        const googleId = profile.id;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const username = profile.displayName || `user_${googleId}`;
        const avatar_url = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

        if (!email) return done(new Error('No email provided by Google'), null);

        // Check if user exists with Google ID
        let userResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
        let user;

        if (userResult.rows.length > 0) {
          user = userResult.rows[0];
        } else {
          // Check if user exists with email
          userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
          if (userResult.rows.length > 0) {
            // Link Google account to existing user
            const updateResult = await pool.query(
              'UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE email = $3 RETURNING *',
              [googleId, avatar_url, email]
            );
            user = updateResult.rows[0];
          } else {
            // Generate a unique username from email
            let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
            let uniqueUsername = baseUsername;
            let counter = 1;
            
            // Check if username exists and make it unique if needed
            while (true) {
              try {
                const insertResult = await pool.query(
                  'INSERT INTO users (username, email, google_id, avatar_url, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                  [uniqueUsername, email, googleId, avatar_url, 'oauth_user']
                );
                user = insertResult.rows[0];
                break; // Exit loop if insert is successful
              } catch (err) {
                if (err.code === '23505' && err.constraint === 'users_username_key') {
                  // Username exists, try with a number suffix
                  uniqueUsername = `${baseUsername}${counter}`;
                  counter++;
                } else {
                  // Some other error occurred
                  throw err;
                }
              }
            }
          }
        }
        return done(null, user);
      } catch (error) {
        console.error('Error in Google OAuth:', error);
        return done(error, null);
      }
    }
  )
);


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


// --- OAuth Routes ---
// Google OAuth routes
app.get('/api/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    try {
      const user = req.user;
      const token = jwt.sign(
        { userId: user.user_id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Send HTML that posts message to parent window (for popup flow)
      // Post message to frontend origin (localhost:5173 for Vite dev server)
      const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Login Successful</title></head>
          <body>
            <script>
              console.log('OAuth callback: Posting message to opener');
              if (window.opener) {
                window.opener.postMessage({
                  type: 'oauth-success',
                  token: '${token}',
                  user: {
                    user_id: '${user.user_id}',
                    username: '${user.username}',
                    avatar_url: '${user.avatar_url || ''}'
                  }
                }, '${frontendOrigin}');
                console.log('OAuth callback: Message posted, closing window');
                setTimeout(() => window.close(), 1000);
              } else {
                console.error('OAuth callback: No window.opener found');
              }
            </script>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2>✓ Login Successful!</h2>
              <p>You can close this window now.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Google callback:', error);
      const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Login Failed</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'oauth-error', error: 'Authentication failed' }, '${frontendOrigin}');
              }
              setTimeout(() => window.close(), 2000);
            </script>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
              <h2>✗ Login Failed</h2>
              <p>Please try again.</p>
            </div>
          </body>
        </html>
      `);
    }
  }
);

// --- Main API Routes ---
// This is where the application's API endpoints are defined.
// The server delegates requests to the appropriate router based on the URL prefix.
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/chat', chatRoutes);

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

