const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

/**
 * Get user points and achievements
 * GET /api/users/:userId/points
 */
router.get('/:userId/points', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's journal entries count and dates
    const entriesResult = await pool.query(
      'SELECT COUNT(*) as count, ARRAY_AGG(created_at ORDER BY created_at) as dates FROM journal_entries WHERE user_id = $1',
      [userId]
    );
    
    const entriesCount = parseInt(entriesResult.rows[0]?.count || 0, 10);
    const entryDates = entriesResult.rows[0]?.dates || [];
    
    // Calculate current streak
    let currentStreak = 0;
    if (entryDates.length > 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastEntryDate = new Date(entryDates[entryDates.length - 1]);
      const isToday = lastEntryDate.toDateString() === today.toDateString() || 
                     lastEntryDate.toDateString() === yesterday.toDateString();
      
      if (isToday) {
        currentStreak = 1;
        let currentDate = new Date(lastEntryDate);
        
        for (let i = entryDates.length - 2; i >= 0; i--) {
          const prevDate = new Date(entryDates[i]);
          const diffTime = currentDate - prevDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
            currentDate = prevDate;
          } else if (diffDays > 1) {
            break; // Streak broken
          }
        }
      }
    }
    
    // Get or create user points record
    const pointsResult = await pool.query(
      'INSERT INTO user_points (user_id, total_points, current_streak, longest_streak, entries_count) ' +
      'VALUES ($1, 0, 0, 0, 0) ' +
      'ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id ' +
      'RETURNING *',
      [userId]
    );
    
    let userPoints = pointsResult.rows[0];
    
    // Update with current values
    await pool.query(
      'UPDATE user_points SET entries_count = $1, current_streak = $2, ' +
      'longest_streak = GREATEST(longest_streak, $2) ' +
      'WHERE user_id = $3 RETURNING *',
      [entriesCount, currentStreak, userId]
    );
    
    // Get unlocked achievements
    const achievementsResult = await pool.query(
      'SELECT * FROM user_achievements WHERE user_id = $1',
      [userId]
    );
    
    // Check for new achievements
    const allAchievements = [
      { id: 'first_entry', check: () => entriesCount >= 1 },
      { id: 'streak_3_days', check: () => currentStreak >= 3 },
      { id: 'streak_7_days', check: () => currentStreak >= 7 },
      { id: 'streak_30_days', check: () => currentStreak >= 30 },
      { id: 'journal_enthusiast', check: () => entriesCount >= 10 },
      { id: 'journal_master', check: () => entriesCount >= 50 },
      { id: 'journal_legend', check: () => entriesCount >= 100 },
      { id: 'super_writer', check: () => entriesCount >= 3 }
    ];
    
    const unlockedAchievements = [];
    const existingAchievementIds = new Set(achievementsResult.rows.map(a => a.achievement_id));
    
    for (const achievement of allAchievements) {
      if (!existingAchievementIds.has(achievement.id) && achievement.check()) {
        // Award achievement
        await pool.query(
          'INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) ' +
          'VALUES ($1, $2, NOW())',
          [userId, achievement.id]
        );
        
        // Add to response
        unlockedAchievements.push({
          id: achievement.id,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        });
      }
    }
    
    // Get all achievements with their unlocked status
    const allAchievementsWithStatus = await pool.query(
      `SELECT a.id, a.name, a.description, a.points, a.icon, 
              ua.unlocked_at as "unlockedAt" 
       FROM achievements a 
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1`,
      [userId]
    );
    
    // Calculate total points
    const totalPointsResult = await pool.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM achievements a ' +
      'JOIN user_achievements ua ON a.id = ua.achievement_id ' +
      'WHERE ua.user_id = $1',
      [userId]
    );
    
    const totalPoints = parseInt(totalPointsResult.rows[0]?.total || 0, 10);
    
    // Prepare response
    const response = {
      totalPoints,
      currentStreak,
      longestStreak: Math.max(userPoints.longest_streak, currentStreak),
      entriesCount,
      lastEntryDate: entryDates.length > 0 ? entryDates[entryDates.length - 1] : null,
      achievements: allAchievementsWithStatus.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        points: row.points,
        icon: row.icon,
        unlocked: !!row.unlockedAt,
        unlockedAt: row.unlockedAt
      }))
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error getting user points:', error);
    res.status(500).json({ message: 'Error getting user points' });
  }
});

/**
 * Award points for a journal entry
 * POST /api/users/:userId/points/entry
 */
router.post('/:userId/points/entry', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { entryId } = req.body;
    
    if (!entryId) {
      return res.status(400).json({ message: 'Entry ID is required' });
    }
    
    // Get the entry to verify it exists and belongs to the user
    const entryResult = await pool.query(
      'SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2',
      [entryId, userId]
    );
    
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }
    
    // Get current points and achievements
    const pointsResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/users/${userId}/points`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    if (!pointsResponse.ok) {
      throw new Error('Failed to get user points');
    }
    
    const pointsData = await pointsResponse.json();
    
    // Check if we should award points for this entry
    const pointsAwarded = 10; // Base points per entry
    
    // Update user's total points
    await pool.query(
      'UPDATE user_points SET total_points = total_points + $1 WHERE user_id = $2',
      [pointsAwarded, userId]
    );
    
    // Get any newly unlocked achievements
    const newAchievements = [];
    
    // Check for the super writer achievement (more than 3 entries)
    if (pointsData.entriesCount >= 3 && 
        !pointsData.achievements.some(a => a.id === 'super_writer' && a.unlocked)) {
      newAchievements.push({
        id: 'super_writer',
        name: 'Super Writer',
        description: 'Write more than 3 journal entries',
        points: 50,
        icon: '🚀',
        unlocked: true,
        unlockedAt: new Date().toISOString()
      });
    }
    
    res.json({
      pointsAwarded,
      superPointsAwarded: newAchievements.reduce((sum, a) => sum + a.points, 0),
      achievements: newAchievements
    });
    
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({ message: 'Error awarding points' });
  }
});

module.exports = router;
