const jwt = require('jsonwebtoken');

/**
 * This middleware function verifies the JSON Web Token (JWT) sent by the client.
 * If the token is valid, it attaches the decoded user payload to the request object
 * and passes control to the next middleware or route handler.
 */
const authMiddleware = (req, res, next) => {
  try {
    // 1. Get the token from the Authorization header.
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');

    // 2. Check if the header exists and is in the correct format ('Bearer <token>').
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If not, the user is not authenticated.
      console.log('No valid auth header found');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 3. Extract the token from the header string.
    const token = authHeader.split(' ')[1]; // "Bearer <token>" -> "<token>"

    // 4. Verify the token using the secret key.
    // This will throw an error if the token is invalid or expired.
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded user payload:', decodedPayload);

    // 5. If verification is successful, attach the payload to the request object.
    // The payload contains the user's ID and username we added during login.
    req.user = decodedPayload;

    // 6. Call next() to proceed to the actual route handler (e.g., createCommunity).
    next();

  } catch (error) {
    // If jwt.verify fails, it will throw an error (e.g., TokenExpiredError, JsonWebTokenError).
    console.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
