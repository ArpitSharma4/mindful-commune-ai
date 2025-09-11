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

module.exports = {
  createPost,
};

