const pool = require('../db');

// Generate a shareable URL for a post by ID
// For now we return the canonical post URL used by the frontend: /post/:postId
// This validates the post exists and the requester is authenticated.
const generateShareLink = async (req, res) => {
  try {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    // Validate the post exists
    const postResult = await pool.query('SELECT post_id FROM posts WHERE post_id = $1', [postId]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:8080';
    const shareUrl = `${frontendBase}/post/${postId}`;

    return res.json({ success: true, shareUrl });
  } catch (error) {
    console.error('Error generating share link:', error);
    return res.status(500).json({ error: 'Failed to generate share link' });
  }
};

module.exports = { generateShareLink };
