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

  // --- Query 4 & Calculation: Current Streak ---
  const streakQuery = `
    SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') AS entry_date 
    FROM journal_entries 
    WHERE author_id = $1 
    ORDER BY entry_date DESC;
  `;
  const streakResult = await pool.query(streakQuery, [userId]);
  const entryDates = streakResult.rows.map(row => new Date(row.entry_date));

  let currentStreak = 0;
  if (entryDates.length > 0) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    if (entryDates[0].getTime() === today.getTime() || entryDates[0].getTime() === yesterday.getTime()) {
      currentStreak = 1;
      for (let i = 1; i < entryDates.length; i++) {
        const expectedPreviousDate = new Date(entryDates[i-1]);
        expectedPreviousDate.setUTCDate(expectedPreviousDate.getUTCDate() - 1);
        if (entryDates[i].getTime() === expectedPreviousDate.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }
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