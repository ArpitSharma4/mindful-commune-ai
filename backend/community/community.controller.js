const pool = require('../db');

/**
 * Creates a new community. (Protected)
 */
const createCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Community name is required.' });
    }

    const creator_id = req.user.userId;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newCommunityQuery = `
      INSERT INTO communities (name, slug, description, creator_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const newCommunity = await pool.query(newCommunityQuery, [name, slug, description, creator_id]);
    const communityId = newCommunity.rows[0].community_id;

// Auto-join the creator to their own community
const autoJoinQuery = `
  INSERT INTO community_members (user_id, community_id)
  VALUES ($1, $2)
  ON CONFLICT (user_id, community_id) DO NOTHING;
`;
await pool.query(autoJoinQuery, [creator_id, communityId]);
    // Get the complete community data with creator info and counts
    const completeDataQuery = `
      SELECT 
        c.*, 
        u.username AS creator_username,
        (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.community_id) AS member_count,
        (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.community_id) AS post_count
      FROM communities c
      JOIN users u ON c.creator_id = u.user_id
      WHERE c.community_id = $1;
    `;
    const completeData = await pool.query(completeDataQuery, [communityId]);
    
    // Parse counts to integers
    const community = completeData.rows[0];
    community.member_count = parseInt(community.member_count, 10);
    community.post_count = parseInt(community.post_count, 10);

    res.status(201).json(community);
  } catch (error)
 {
    console.error('Error creating community:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A community with this name already exists.' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Fetches all communities with their creator's name, member count, and post count. (Public)
 */
const getAllCommunities = async (req, res) => {
  try {
    console.log('Fetching all communities');
    // REFACTORED QUERY: Using correlated subqueries for counts. This is more consistent
    // with getCommunityById and can be more efficient.
    const allCommunitiesQuery = `
      SELECT 
        c.*,
        u.username AS creator_username,
        (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.community_id) AS member_count,
        (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.community_id) AS post_count
      FROM communities c
      JOIN users u ON c.creator_id = u.user_id
      ORDER BY c.created_at DESC;
    `;
    const result = await pool.query(allCommunitiesQuery);
    const communities = result.rows;

    // ADDED: Parse counts from string to integer for each community, which was missing.
    communities.forEach(community => {
      community.member_count = parseInt(community.member_count, 10);
      community.post_count = parseInt(community.post_count, 10);
    });

    console.log('Found communities:', communities.length);
    console.log('Community IDs:', communities.map(c => c.community_id));
    res.status(200).json(communities);
  } catch (error) {
    console.error('Error fetching all communities:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Fetches details for a single community by its ID. (Public)
 */
const getCommunityById = async (req, res) => {
  try {
    const { communityId } = req.params;

    const query = `
      SELECT 
        c.*, 
        u.username AS creator_username,
        (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.community_id) AS member_count,
        (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.community_id) AS post_count
      FROM communities c
      JOIN users u ON c.creator_id = u.user_id
      WHERE c.community_id = $1;
    `;
    const result = await pool.query(query, [communityId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Community not found.' });
    }
    
    const community = result.rows[0];
    community.member_count = parseInt(community.member_count, 10);
    community.post_count = parseInt(community.post_count, 10);

    console.log('Community data for ID', communityId, ':', {
      name: community.name,
      member_count: community.member_count,
      post_count: community.post_count
    });

    res.status(200).json(community);
  } catch (error) {
    console.error('Error fetching community by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Fetches all communities the current user has joined. (Protected)
 */
const getJoinedCommunities = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Fetching joined communities for user ID:', userId);
    
    const joinedCommunitiesQuery = `
      SELECT 
        c.*, 
        u.username AS creator_username,
        (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.community_id) AS member_count,
        (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.community_id) AS post_count
      FROM communities c
      JOIN community_members cm ON c.community_id = cm.community_id
      JOIN users u ON c.creator_id = u.user_id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC;
    `;
    const joinedCommunities = await pool.query(joinedCommunitiesQuery, [userId]);
    console.log('Found joined communities:', joinedCommunities.rows.length);
    console.log('Joined community IDs:', joinedCommunities.rows.map(c => c.community_id));
    
    // Parse counts from string to integer for each community
    const communities = joinedCommunities.rows;
    communities.forEach(community => {
      community.member_count = parseInt(community.member_count, 10);
      community.post_count = parseInt(community.post_count, 10);
    });
    
    console.log('Joined communities with counts:', communities.map(c => ({
      id: c.community_id,
      name: c.name,
      member_count: c.member_count,
      post_count: c.post_count
    })));
    
    res.status(200).json(communities);
  } catch (error) {
    console.error('Error fetching joined communities:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Allows the current user to join a community. (Protected)
 */
const joinCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user.userId;
    const joinQuery = `
      INSERT INTO community_members (user_id, community_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
    await pool.query(joinQuery, [userId, communityId]);
    res.status(200).json({ message: 'Successfully joined the community!' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'You are already a member of this community.' });
    }
    console.error('Error joining community:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Allows the current user to leave a community. (Protected)
 */
const leaveCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user.userId;
    const leaveQuery = `
      DELETE FROM community_members 
      WHERE user_id = $1 AND community_id = $2
      RETURNING *;
    `;
    const result = await pool.query(leaveQuery, [userId, communityId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'You are not a member of this community.' });
    }
    res.status(200).json({ message: 'Successfully left the community.' });
  } catch (error) {
    console.error('Error leaving community:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  getJoinedCommunities,
  joinCommunity,
  leaveCommunity,
};

