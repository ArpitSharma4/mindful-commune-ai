export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: MoodType;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export type MoodType = 'great' | 'good' | 'okay' | 'bad' | 'awful';

export interface MoodOption {
  value: MoodType;
  label: string;
  emoji: string;
  color: string;
}

export interface AIFeedback {
  id: string;
  entryId: string;
  feedback: string;
  createdAt: Date;
}

export interface JournalPrompt {
  id: string;
  text: string;
  category: 'gratitude' | 'reflection' | 'growth' | 'challenge' | 'celebration';
}

export interface CreateJournalEntryRequest {
  title: string;
  content: string;
  mood: MoodType;
}

export interface JournalStats {
  totalEntries: number;
  averageMood: number;
  moodDistribution: Record<MoodType, number>;
  streakDays: number;
  lastEntryDate?: Date;
}
