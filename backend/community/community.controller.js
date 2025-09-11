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

const getAllCommunities = async (req, res) => {
  try {
    // 1. Query the database to get all communities.
    // We join with the users table to also fetch the creator's username.
    const allCommunitiesQuery = `
      SELECT c.*, u.username AS creator_username
      FROM communities c
      JOIN users u ON c.creator_id = u.user_id
      ORDER BY c.created_at DESC;
    `;
    const allCommunities = await pool.query(allCommunitiesQuery);

    // 2. Send the list of communities as a JSON response.
    res.status(200).json(allCommunities.rows);

  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const joinCommunity = async (req, res) => {
  try {
    // 1. Get the communityId from the URL parameters.
    const { communityId } = req.params;
    // 2. Get the userId from the authenticated user (provided by authMiddleware).
    const userId = req.user.userId;

    // 3. Insert the new membership record into the join table.
    const joinQuery = `
      INSERT INTO community_members (user_id, community_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    await pool.query(joinQuery, [userId, communityId]);

    // 4. Send a success response.
    res.status(200).json({ message: 'Successfully joined the community!' });

  } catch (error) {
    console.error('Error joining community:', error);
    // This specific error code means a unique constraint was violated.
    if (error.code === '23505') {
      return res.status(409).json({ error: 'You are already a member of this community.' });
    }
    // For other errors, send a generic server error.
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createCommunity,
  getAllCommunities,
  joinCommunity,
};

