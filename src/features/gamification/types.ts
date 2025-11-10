// Achievement types
export type AchievementType = 
  | 'first_entry'
  | 'streak_3_days'
  | 'streak_7_days'
  | 'streak_30_days'
  | 'journal_enthusiast' // 10 entries
  | 'journal_master'     // 50 entries
  | 'journal_legend'    // 100 entries
  | 'super_writer';     // More than 3 entries

export interface Achievement {
  id: AchievementType;
  name: string;
  description: string;
  points: number;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface UserPoints {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  entriesCount: number;
  lastEntryDate?: string;
  achievements: Achievement[];
}

export interface AwardPointsResponse {
  pointsAwarded: number;
  superPointsAwarded: number;
  achievements: Achievement[];
}
