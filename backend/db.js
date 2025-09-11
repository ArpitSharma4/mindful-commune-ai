// backend/db.js

const { Pool } = require('pg');
require('dotenv').config();

// The Pool manages multiple client connections to the database.
// It will automatically open, manage, and close connections.
// We use environment variables for security and portability.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    return;
  }
  console.log('✅ Database connected successfully');
  release();
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// Export the pool so other parts of the application can use it to query the database.
module.exports = pool;
