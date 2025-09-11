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

// Export the pool so other parts of the application can use it to query the database.
module.exports = pool;
