// backend/users/users.controller.js

const pool = require('../db'); // The database connection pool
const bcrypt = require('bcrypt'); // For hashing passwords
const jwt = require('jsonwebtoken');

// Password validation function
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return errors;
};

//Create a new user in the database
const createUser = async (req, res) => {
  try {
    console.log('Received request body:', req.body)
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        errors: passwordErrors
      });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUserQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING user_id, username, email, created_at;
    `;
    
    const newUser = await pool.query(newUserQuery, [username, email, password_hash]);

    // 5. WHAT: Send a success response.
    //    WHY: To let the client know the user was created successfully and provide the new user's data.
    //         We don't send the password_hash back.
    res.status(201).json(newUser.rows[0]);

  } catch (error) {
    // 6. WHERE: Error handling is crucial.
    //    WHY: If anything goes wrong (e.g., duplicate username), we need to send a meaningful error.
    console.error('Error creating user:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    
    // Check for PostgreSQL's unique violation error code
    if (error.code === '23505') {
      // Determine which field is duplicated based on constraint name
      let duplicateField = 'Username or email';
      if (error.constraint === 'users_username_key') {
        duplicateField = 'Username';
      } else if (error.constraint === 'users_email_key') {
        duplicateField = 'Email';
      }
      
      return res.status(409).json({ 
        error: `${duplicateField} already exists. Please choose a different one.` 
      });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Logic to log in a user.
 */
const loginUser = async (req, res) => {
  try {
    // 1. Get email and password from the request body.
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Find the user in the database by their email.
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    // 3. If no user is found, send a generic error for security.
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // 4. Compare the provided password with the stored hash.
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    // 5. If passwords don't match, send the same generic error.
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 6. If login is successful, create a JWT payload and the token.
    const payload = {
      userId: user.user_id,
      username: user.username
    };
    
    // Sign the token with a secret key from your .env file
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token will be valid for 1 hour
    );

    // 7. Send the token back to the client.
    res.status(200).json({
      message: 'Login successful!',
      token: token
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Remember to export both functions so the router can use them.
module.exports = {
  createUser,
  loginUser,
};
