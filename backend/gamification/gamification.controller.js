const pool = require('../db');
 // We'll reuse your stats function

/**
 * Re-usable helper function to get user's stats
 * (This is the logic from your `getJournalStats` controller)
 */
const getUserStats = async (userId) => {
  // --- Query 1: Total Entries ---
  const totalQuery = 'SELECT COUNT(*) AS total_entries FROM journal_entries WHERE author_id = $1';
  const totalResult = await pool.query(totalQuery, [userId]);
  const totalEntries = parseInt(totalResult.rows[0].total_entries, 10);

  // --- Query 2: Current Streak ---
  // This new query is much more robust
  const streakQuery = `
    WITH distinct_days AS (
      -- Get all unique days the user posted, in UTC
      SELECT DISTINCT DATE_TRUNC('day', created_at AT TIME ZONE 'UTC') AS entry_day
      FROM journal_entries
      WHERE author_id = $1
    ),
    day_series AS (
      -- Create a series of all days from the user's first post to today
      SELECT generate_series(
        (SELECT MIN(entry_day) FROM distinct_days),
        (CURRENT_DATE AT TIME ZONE 'UTC'),
        '1 day'::interval
      ) AS day
    ),
    streaks AS (
      -- Check if the user posted on each day in the series
      SELECT
        day,
        (SELECT 1 FROM distinct_days WHERE entry_day = day_series.day) AS posted,
        -- Create groups for consecutive days of posting/not-posting
        (
          ROW_NUMBER() OVER(ORDER BY day)
          - ROW_NUMBER() OVER(PARTITION BY (SELECT 1 FROM distinct_days WHERE entry_day = day_series.day) ORDER BY day)
        ) as streak_group
      FROM day_series
    )
    -- Get the most recent streak
    SELECT COUNT(*) AS current_streak
    FROM streaks
    WHERE streak_group = (SELECT streak_group FROM streaks ORDER BY day DESC LIMIT 1)
    AND posted = 1;
  `;
  
  const streakResult = await pool.query(streakQuery, [userId]);
  let currentStreak = 0;

  // This checks if the user posted today OR yesterday, which is the minimum for a streak
  const lastPostQuery = `
    SELECT 1 FROM journal_entries
    WHERE author_id = $1
    AND (created_at AT TIME ZONE 'UTC')::date >= (CURRENT_DATE AT TIME ZONE 'UTC' - '1 day'::interval)
    LIMIT 1;
  `;
  const lastPostResult = await pool.query(lastPostQuery, [userId]);

  if (lastPostResult.rowCount > 0) {
    // If they posted today/yesterday, use the streak value
    currentStreak = parseInt(streakResult.rows[0]?.current_streak || '0', 10);
  }
  // Otherwise, the streak is 0 (the default)

  return { totalEntries, currentStreak };
};

/**
 * This is the "Engine" that runs after a journal entry is created.
 */
// Replace the entire function in gamification.controller.js

const checkAndAwardAchievements = async (userId) => {
  console.log(`[ACHIEVEMENT CHECK] Starting for user ${userId}`);
  
  // 1. Get user's current stats
  const { totalEntries, currentStreak } = await getUserStats(userId);
  console.log(`[ACHIEVEMENT CHECK] Stats found: ${totalEntries} entries, ${currentStreak} streak`);

  // 2. Get all possible achievements
  const allAchievementsResult = await pool.query('SELECT * FROM achievements');
  const allAchievements = allAchievementsResult.rows;

  // 3. Get achievements user *already has*
  const earnedAchievementsResult = await pool.query('SELECT achievement_id FROM user_achievements WHERE user_id = $1', [userId]);
  const earnedIds = new Set(earnedAchievementsResult.rows.map(r => r.achievement_id));
  console.log(`[ACHIEVEMENT CHECK] User already has ${earnedIds.size} achievements.`);

  // 4. Loop and check
  for (const ach of allAchievements) {
    if (earnedIds.has(ach.id)) {
      continue; // User already has this, skip
    }

    let userEarnedIt = false;
    console.log(`[ACHIEVEMENT CHECK] Checking for "${ach.code}"...`);

    // --- This is the core logic ---
    switch (ach.code) {
      case 'FIRST_ENTRY':
        if (totalEntries >= 1) userEarnedIt = true;
        break;
      case '10_ENTRIES':
        if (totalEntries >= 10) userEarnedIt = true;
        break;
      case '3_DAY_STREAK':
        if (currentStreak >= 3) userEarnedIt = true;
        break;
      case 'WEEKLY_STREAK':
        if (currentStreak >= 7) userEarnedIt = true;
        break;
      case 'MONTHLY_STREAK':
        if (currentStreak >= 30) userEarnedIt = true;
        break;
    }
    // --- End of logic ---

    if (userEarnedIt) {
      // 5. Award the achievement!
      console.log(`[ACHIEVEMENT CHECK] SUCCESS: User earned "${ach.code}". Attempting to award.`);
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Add to user_achievements
        console.log(`[ACHIEVEMENT CHECK] 1. Inserting into user_achievements: (User: ${userId}, Ach. ID: ${ach.id})`);
        const query1 = 'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)';
        await client.query(query1, [userId, ach.id]);
        
        // Update user's total points
        console.log(`[ACHIEVEMENT CHECK] 2. Updating user points: (User: ${userId}, Points: ${ach.points})`);
        const query2 = 'UPDATE users SET total_points = total_points + $1 WHERE user_id = $2';
        await client.query(query2, [ach.points, userId]);
        
        await client.query('COMMIT');
        console.log(`[ACHIEVEMENT CHECK] 3. COMMIT successful.`);
        
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('[ACHIEVEMENT CHECK] FATAL ERROR: Transaction rolled back.', e);
      } finally {
        client.release();
      }
    }
  }
};
const getGamificationStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    await checkAndAwardAchievements(userId);
    // 1. Get user's current stats
    const { totalEntries, currentStreak } = await getUserStats(userId);

    // 2. Get user's total points
    const pointsResult = await pool.query('SELECT total_points FROM users WHERE user_id = $1', [userId]);
    const totalPoints = pointsResult.rows[0]?.total_points || 0;

    // 3. Get master list of all achievements
    const allAchievementsResult = await pool.query('SELECT * FROM achievements ORDER BY points ASC');
    
    // 4. Get list of earned achievement IDs
    const earnedAchievementsResult = await pool.query('SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = $1', [userId]);
    const earnedMap = new Map(earnedAchievementsResult.rows.map(r => [r.achievement_id, r.earned_at]));

    // 5. Combine them
    const achievements = allAchievementsResult.rows.map(ach => ({
      ...ach,
      isEarned: earnedMap.has(ach.id),
      earnedAt: earnedMap.get(ach.id) || null
    }));

    // 6. Send the final payload
    res.status(200).json({
      totalPoints,
      totalEntries,
      currentStreak,
      achievements: achievements
    });

  } catch (error) {
    console.error('Error in getGamificationStatus:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  checkAndAwardAchievements,
  getGamificationStatus,
  
};