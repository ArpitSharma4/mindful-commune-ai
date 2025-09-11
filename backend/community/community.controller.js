const pool = require('../db');

/**
 * Logic to create a new community.
 * This is a protected action; only logged-in users can create communities.
 */
const createCommunity = async (req, res) => {
  try {
    // 1. Get community details from the request body.
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Community name is required.' });
    }

    // 2. The creator's ID comes from the auth middleware (req.user), NOT the request body.
    // This ensures that only the authenticated user can be the creator.
    const creator_id = req.user.userId;

    // 3. Create a URL-friendly "slug" from the name.
    // Example: "Anxiety Support" -> "anxiety-support"
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // 4. Insert the new community into the database.
    const newCommunityQuery = `
      INSERT INTO communities (name, slug, description, creator_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const newCommunity = await pool.query(newCommunityQuery, [name, slug, description, creator_id]);

    // 5. Send the newly created community back as the response.
    res.status(201).json(newCommunity.rows[0]);

  } catch (error) {
    console.error('Error creating community:', error);
    // Handle potential unique constraint violation on 'name' or 'slug'
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A community with this name already exists.' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createCommunity,
};
