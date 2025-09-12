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
    // 1. Query the database to get all communities with member and post counts.
    const allCommunitiesQuery = `
      SELECT 
        c.*,
        u.username AS creator_username,
        COALESCE(member_counts.member_count, 0) AS member_count,
        COALESCE(post_counts.post_count, 0) AS post_count
      FROM communities c
      JOIN users u ON c.creator_id = u.user_id
      LEFT JOIN (
        SELECT community_id, COUNT(*) as member_count
        FROM community_members
        GROUP BY community_id
      ) member_counts ON c.community_id = member_counts.community_id
      LEFT JOIN (
        SELECT community_id, COUNT(*) as post_count
        FROM posts
        GROUP BY community_id
      ) post_counts ON c.community_id = post_counts.community_id
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

const getJoinedCommunities = async (req, res) => {
  try {
    // 1. Get the userId from the authenticated user (provided by authMiddleware).
    const userId = req.user.userId;

    // 2. Query the database to get all communities the user has joined.
    const joinedCommunitiesQuery = `
      SELECT c.*, u.username AS creator_username
      FROM communities c
      JOIN community_members cm ON c.community_id = cm.community_id
      JOIN users u ON c.creator_id = u.user_id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC;
    `;
    const joinedCommunities = await pool.query(joinedCommunitiesQuery, [userId]);

    // 3. Send the list of joined communities as a JSON response.
    res.status(200).json(joinedCommunities.rows);

  } catch (error) {
    console.error('Error fetching joined communities:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCommunityById = async (req, res) => {
  try {
    // 1. Get the communityId from the URL parameters.
    const { communityId } = req.params;

    // 2. Query the database to get the specific community with creator info.
    const communityQuery = `
      SELECT c.*, u.username AS creator_username
      FROM communities c
      JOIN users u ON c.creator_id = u.user_id
      WHERE c.community_id = $1;
    `;
    const communityResult = await pool.query(communityQuery, [communityId]);

    if (communityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Community not found.' });
    }

    // 3. Get member count for this community
    const memberCountQuery = `
      SELECT COUNT(*) as member_count
      FROM community_members
      WHERE community_id = $1;
    `;
    const memberCountResult = await pool.query(memberCountQuery, [communityId]);

    // 4. Get post count for this community
    const postCountQuery = `
      SELECT COUNT(*) as post_count
      FROM posts
      WHERE community_id = $1;
    `;
    const postCountResult = await pool.query(postCountQuery, [communityId]);

    // 5. Combine the data
    const community = {
      ...communityResult.rows[0],
      member_count: parseInt(memberCountResult.rows[0].member_count),
      post_count: parseInt(postCountResult.rows[0].post_count)
    };

    res.status(200).json(community);

  } catch (error) {
    console.error('Error fetching community by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const leaveCommunity = async (req, res) => {
  try {
    // 1. Get the communityId from the URL parameters.
    const { communityId } = req.params;
    // 2. Get the userId from the authenticated user (provided by authMiddleware).
    const userId = req.user.userId;

    // 3. Delete the membership record from the join table.
    const leaveQuery = `
      DELETE FROM community_members 
      WHERE user_id = $1 AND community_id = $2
      RETURNING *;
    `;
    const result = await pool.query(leaveQuery, [userId, communityId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'You are not a member of this community.' });
    }

    // 4. Send a success response.
    res.status(200).json({ message: 'Successfully left the community!' });

  } catch (error) {
    console.error('Error leaving community:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createCommunity,
  getAllCommunities,
  joinCommunity,
  leaveCommunity,
  getJoinedCommunities,
  getCommunityById,
};
