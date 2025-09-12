const pool = require('../db');

// ... (the createComment function code remains the same) ...
const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parent_comment_id, is_posted_anonymously } = req.body;
    const userId = req.user.userId;
    const query = `
      INSERT INTO comments (post_id, author_id, content, parent_comment_id, is_posted_anonymously)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [postId, userId, content, parent_comment_id || null, is_posted_anonymously || false];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    console.log(`[DEBUG] Fetching comments for postId: ${postId}`);
    
    // Get all comments for the post with author information and vote scores
    const commentsQuery = `
      SELECT 
        c.comment_id,
        c.content,
        c.parent_comment_id,
        c.created_at,
        c.updated_at,
        c.is_posted_anonymously,
        u.username AS author_username,
        c.author_id,
        COALESCE(SUM(v.vote_type), 0) AS vote_score
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.user_id
      LEFT JOIN votes v ON c.comment_id = v.comment_id
      WHERE c.post_id = $1
      GROUP BY c.comment_id, c.content, c.parent_comment_id, c.created_at, c.updated_at, c.is_posted_anonymously, u.username, c.author_id
      ORDER BY c.created_at ASC;
    `;

    console.log(`[DEBUG] Executing query with postId: ${postId}`);
    const result = await pool.query(commentsQuery, [postId]);
    const comments = result.rows;
    console.log(`[DEBUG] Raw comments from DB:`, comments.length, comments);

    // Process anonymous comments
    comments.forEach(comment => {
      if (comment.is_posted_anonymously) {
        comment.author_username = "Anonymous";
      }
      // Convert vote_score to integer
      comment.vote_score = parseInt(comment.vote_score, 10);
    });

    // Organize comments into threaded structure
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create comment objects with replies array
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.comment_id, comment);
    });

    // Second pass: organize into threaded structure
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        // This is a reply to another comment
        const parentComment = commentMap.get(comment.parent_comment_id);
        if (parentComment) {
          parentComment.replies.push(comment);
        }
      } else {
        // This is a root-level comment
        rootComments.push(comment);
      }
    });

    console.log(`[DEBUG] Processed comments - Root comments:`, rootComments.length);
    console.log(`[DEBUG] Final response:`, rootComments);
    res.status(200).json(rootComments);

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const voteOnComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType } = req.body; // Expects 1 (upvote) or -1 (downvote)
    const userId = req.user.userId;

    // 1. Validate input
    if (voteType !== 1 && voteType !== -1) {
      return res.status(400).json({ error: 'Invalid vote type. Must be 1 or -1.' });
    }

    // 2. Check for an existing vote from this user on this comment
    const existingVoteQuery = `SELECT * FROM votes WHERE voter_id = $1 AND comment_id = $2;`;
    const existingVoteResult = await pool.query(existingVoteQuery, [userId, commentId]);
    const existingVote = existingVoteResult.rows[0];

    // 3. Apply voting logic
    if (!existingVote) {
      // CASE 1: No vote exists. Insert a new one.
      const insertVoteQuery = `INSERT INTO votes (voter_id, comment_id, vote_type) VALUES ($1, $2, $3);`;
      await pool.query(insertVoteQuery, [userId, commentId, voteType]);
    } else if (parseInt(existingVote.vote_type, 10) === voteType) {
      // THE FIX IS HERE: Ensure we use parseInt on the database value before comparing.
      // CASE 2: Voting the same way again. Rescind the vote.
      const deleteVoteQuery = `DELETE FROM votes WHERE voter_id = $1 AND comment_id = $2;`;
      await pool.query(deleteVoteQuery, [userId, commentId]);
    } else {
      // CASE 3: Changing the vote. Update the existing row.
      const updateVoteQuery = `UPDATE votes SET vote_type = $1 WHERE voter_id = $2 AND comment_id = $3;`;
      await pool.query(updateVoteQuery, [voteType, userId, commentId]);
    }

    // 4. Calculate and return the new total vote score for the comment
    const scoreQuery = `SELECT COALESCE(SUM(vote_type), 0) AS score FROM votes WHERE comment_id = $1;`;
    const scoreResult = await pool.query(scoreQuery, [commentId]);
    const newScore = scoreResult.rows[0].score;

    // Also parse the final result for consistency
    res.status(200).json({ newScore: parseInt(newScore, 10) });

  } catch (error) {
    console.error('Error voting on comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createComment,
  getCommentsByPost,
  voteOnComment,
};
