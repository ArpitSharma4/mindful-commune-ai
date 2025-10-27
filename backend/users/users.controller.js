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
      { expiresIn: '1h' } // Token will be valid for 24 hours
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

/**
 * Get current user profile
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    
    const query = `
      SELECT user_id, username, email, COALESCE(avatar_url, '') as avatar_url, created_at
      FROM users
      WHERE user_id = $1;
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Delete user account
 */
const deleteUser = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    
    // Delete user and all associated data (cascade delete should handle related records)
    const deleteQuery = `
      DELETE FROM users
      WHERE user_id = $1
      RETURNING user_id, username;
    `;
    
    const result = await pool.query(deleteQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'Account deleted successfully',
      deletedUser: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
/**
 * Update user avatar
 */
const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar file provided' });
    }

    // Construct the avatar URL
    const avatarUrl = `/uploads/${req.file.filename}`;

    // Update user's avatar in database
    const updateQuery = `
      UPDATE users
      SET avatar_url = $1
      WHERE user_id = $2
      RETURNING user_id, username, avatar_url;
    `;
    
    const result = await pool.query(updateQuery, [avatarUrl, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Avatar updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Remove user avatar
 */
const removeAvatar = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware

    // Update user's avatar to null in database
    const updateQuery = `
      UPDATE users
      SET avatar_url = NULL
      WHERE user_id = $1
      RETURNING user_id, username, avatar_url;
    `;
    
    const result = await pool.query(updateQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Avatar removed successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    // Validate new password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        error: 'New password does not meet requirements',
        errors: passwordErrors
      });
    }

    // Get current user's password hash
    const userQuery = 'SELECT password_hash FROM users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if new password is same as current
    const sameAsOld = await bcrypt.compare(newPassword, user.password_hash);
    if (sameAsOld) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const updateQuery = `
      UPDATE users
      SET password_hash = $1
      WHERE user_id = $2
      RETURNING user_id, username;
    `;
    
    const result = await pool.query(updateQuery, [newPasswordHash, userId]);

    res.status(200).json({ 
      message: 'Password changed successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Remember to export both functions so the router can use them.
module.exports = {
  createUser,
  loginUser,
  getCurrentUser,
  deleteUser,
  changePassword,
  updateAvatar,
  removeAvatar
};