import { apiRequest } from '@/lib/api';
import type { AchievementType, Achievement, UserPoints, AwardPointsResponse } from './types';

// Achievement definitions
const ACHIEVEMENTS: Record<AchievementType, Omit<Achievement, 'unlocked' | 'unlockedAt'>> = {
  first_entry: {
    id: 'first_entry',
    name: 'First Entry',
    description: 'Write your first journal entry',
    points: 10,
    icon: '✏️',
  },
  streak_3_days: {
    id: 'streak_3_days',
    name: '3-Day Streak',
    description: 'Maintain a journaling streak for 3 days',
    points: 25,
    icon: '🔥',
  },
  streak_7_days: {
    id: 'streak_7_days',
    name: 'Weekly Streak',
    description: 'Maintain a journaling streak for 7 days',
    points: 50,
    icon: '🌟',
  },
  streak_30_days: {
    id: 'streak_30_days',
    name: 'Monthly Streak',
    description: 'Maintain a journaling streak for 30 days',
    points: 100,
    icon: '🏆',
  },
  journal_enthusiast: {
    id: 'journal_enthusiast',
    name: 'Journal Enthusiast',
    description: 'Write 10 journal entries',
    points: 30,
    icon: '📓',
  },
  journal_master: {
    id: 'journal_master',
    name: 'Journal Master',
    description: 'Write 50 journal entries',
    points: 100,
    icon: '📚',
  },
  journal_legend: {
    id: 'journal_legend',
    name: 'Journal Legend',
    description: 'Write 100 journal entries',
    points: 250,
    icon: '🏅',
  },
  super_writer: {
    id: 'super_writer',
    name: 'Super Writer',
    description: 'Write more than 3 journal entries',
    points: 50, // Super point value
    icon: '🚀',
  },
};

/**
 * Get user points and achievements
 * @param userId The ID of the user
 * @returns User points and achievements data
 */
export const getUserPoints = async (userId: string): Promise<UserPoints> => {
  try {
    const response = await apiRequest<UserPoints>(`/api/users/${userId}/points`);
    return response || {
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      entriesCount: 0,
      achievements: Object.values(ACHIEVEMENTS).map(ach => ({
        ...ach,
        unlocked: false,
      })),
    };
  } catch (error) {
    console.error('Error fetching user points:', error);
    return {
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      entriesCount: 0,
      achievements: Object.values(ACHIEVEMENTS).map(ach => ({
        ...ach,
        unlocked: false,
      })),
    };
  }
};

/**
 * Award points for a journal entry
 * @param userId The ID of the user
 * @param entryId The ID of the journal entry
 * @returns Points awarded and any achievements unlocked
 */
export const awardJournalEntryPoints = async (userId: string, entryId: string): Promise<AwardPointsResponse> => {
  try {
    const response = await apiRequest<AwardPointsResponse>(
      `/api/users/${userId}/points/entry`,
      {
        method: 'POST',
        body: JSON.stringify({ entryId }),
      }
    );
    
    // If no response from server, return default values
    if (!response) {
      return { 
        pointsAwarded: 0, 
        superPointsAwarded: 0,
        achievements: [] 
      };
    }
    
    // Check if we should award a super point (more than 3 entries)
    const userPoints = await getUserPoints(userId);
    const shouldAwardSuperPoint = userPoints.entriesCount >= 3 && 
      !userPoints.achievements.some(a => a.id === 'super_writer');
    
    // If we should award a super point, add it to the response
    if (shouldAwardSuperPoint) {
      const superWriterAchievement = getAchievement('super_writer');
      superWriterAchievement.unlocked = true;
      superWriterAchievement.unlockedAt = new Date().toISOString();
      
      return {
        ...response,
        superPointsAwarded: superWriterAchievement.points,
        achievements: [...(response.achievements || []), superWriterAchievement]
      };
    }
    
    // Otherwise return the response as is, with 0 super points
    return {
      ...response,
      superPointsAwarded: 0,
      achievements: response.achievements || []
    };
  } catch (error) {
    console.error('Error awarding journal entry points:', error);
    return { 
      pointsAwarded: 0, 
      superPointsAwarded: 0,
      achievements: [] 
    };
  }
};

/**
 * Get achievement details by ID
 * @param id The achievement ID
 * @returns The achievement details with default unlocked state
 */
export const getAchievement = (id: AchievementType): Achievement => ({
  ...ACHIEVEMENTS[id],
  unlocked: false,
});
