const pool = require('../db');

/**
 * Creates a new comment on a specific post.
 * This is a protected action.
 */
const createComment = async (req, res) => {
  try {
    const { postId } = req.params; // This comes from the parent router (posts.route.js)
    const { content, parent_comment_id } = req.body; // parent_comment_id is optional for threaded replies
    const userId = req.user.userId;

    // Validate input
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    // Insert the new comment into the database
    const newCommentQuery = `
      INSERT INTO comments (content, author_id, post_id, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const result = await pool.query(newCommentQuery, [content, userId, postId, parent_comment_id || null]);
    const newComment = result.rows[0];

    res.status(201).json(newComment);

  } catch (error) {
    console.error('Error creating comment:', error);
    // Check for foreign key violation (e.g., post or parent comment does not exist)
    if (error.code === '23503') {
        return res.status(404).json({ error: 'Post or parent comment not found.' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createComment,
};

 