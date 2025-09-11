const pool = require('../db');

/**
 * Logic to create a new post within a specific community.
 * This is a protected and authorized action.
 */
const createPost = async (req, res) => {
  console.log('Received form-data body:', req.body); // <-- ADD THIS LINE
  try {
    // ... rest of your function
    // 1. Extract data from the request
    const { communityId } = req.params;
    const { title, content, is_posted_anonymously } = req.body;
    const authorId = req.user.userId;

    // 2. AUTHORIZATION CHECK: Verify the user is a member of the community
    const membershipCheckQuery = `
      SELECT * FROM community_members WHERE user_id = $1 AND community_id = $2;
    `;
    const membershipResult = await pool.query(membershipCheckQuery, [authorId, communityId]);

    if (membershipResult.rows.length === 0) {
      // If no membership record is found, the user is not authorized.
      return res.status(403).json({ error: 'Forbidden. You must be a member of this community to post.' });
    }

    // 3. Handle the file upload (if one exists)
    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      // Multer provides the file object. We construct a URL-friendly path.
      // IMPORTANT: The path will be served statically from the server root.
      mediaUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype;
    }

    // 4. Insert the new post into the database
    const createPostQuery = `
      INSERT INTO posts (title, content, author_id, community_id, is_posted_anonymously, media_url, media_type, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;
    const { rows } = await pool.query(createPostQuery, [
      title,
      content,
      authorId,
      communityId,
      is_posted_anonymously || false,
      mediaUrl,
      mediaType,
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Logic to get all posts for a specific community.
 * This is a public action.
 */
const getPostsByCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;

    // This powerful query does several things at once:
    // 1. Selects all posts that match the communityId.
    // 2. LEFT JOINs with the users table to get the author's username.
    // 3. Uses a subquery to calculate the vote score (upvotes - downvotes). COALESCE ensures null becomes 0.
    // 4. Uses another subquery to count the number of comments for each post.
    const query = `
      SELECT
        p.post_id,
        p.title,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at,
        p.is_posted_anonymously,
        u.username AS author_username,
        COALESCE((SELECT SUM(vote_type) FROM votes v WHERE v.post_id = p.post_id), 0) AS vote_score,
        COALESCE((SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id), 0) AS comment_count
      FROM
        posts p
      LEFT JOIN
        users u ON p.author_id = u.user_id
      WHERE
        p.community_id = $1
      ORDER BY
        p.created_at DESC;
    `;

    const { rows } = await pool.query(query, [communityId]);

    // Remember our anonymity feature? We need to apply it here.
    // The database gives us the real username, but we will hide it if the flag is true.
    const processedRows = rows.map(post => {
      if (post.is_posted_anonymously) {
        return { ...post, author_username: 'Anonymous' };
      }
      return post;
    });

    res.status(200).json(processedRows);
  } catch (error) {
    console.error('Error fetching posts by community:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Logic to cast, change, or rescind a vote on a post.
 * This is a protected action.
 */
const voteOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { voteType } = req.body; // Expects a value of 1 (upvote) or -1 (downvote)
    const userId = req.user.userId;

    // 1. Validate the input from the request body
    if (voteType !== 1 && voteType !== -1) {
      return res.status(400).json({ error: 'Invalid vote type. Must be 1 or -1.' });
    }

    // 2. Check if the user has already voted on this post
    const existingVoteQuery = `SELECT * FROM votes WHERE voter_id = $1 AND post_id = $2;`;
    const existingVoteResult = await pool.query(existingVoteQuery, [userId, postId]);
    const existingVote = existingVoteResult.rows[0];

    // 3. Apply the voting logic
    if (!existingVote) {
      // CASE 1: No existing vote. Insert a new one.
      const insertVoteQuery = `INSERT INTO votes (voter_id, post_id, vote_type) VALUES ($1, $2, $3);`;
      await pool.query(insertVoteQuery, [userId, postId, voteType]);
    } else if (parseInt(existingVote.vote_type, 10) === voteType) {
      // THE FIX IS HERE: Use parseInt() to ensure a number-to-number comparison.
      // CASE 2: User is voting the same way again. Rescind the vote.
      const deleteVoteQuery = `DELETE FROM votes WHERE voter_id = $1 AND post_id = $2;`;
      await pool.query(deleteVoteQuery, [userId, postId]);
    } else {
      // CASE 3: User is changing their vote (e.g., from up to down).
      const updateVoteQuery = `UPDATE votes SET vote_type = $1 WHERE voter_id = $2 AND post_id = $3;`;
      await pool.query(updateVoteQuery, [voteType, userId, postId]);
    }

    // 4. After the action, calculate and return the new total vote score for the post
    const scoreQuery = `
      SELECT COALESCE(SUM(vote_type), 0) AS score FROM votes WHERE post_id = $1;
    `;
    const scoreResult = await pool.query(scoreQuery, [postId]);
    const newScore = scoreResult.rows[0].score;

    res.status(200).json({ newScore: parseInt(newScore) });

  } catch (error) {
    console.error('Error voting on post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createPost,
  getPostsByCommunity,
  voteOnPost,
};

