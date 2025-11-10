-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default achievements
INSERT INTO achievements (id, name, description, points, icon) VALUES
  ('first_entry', 'First Entry', 'Write your first journal entry', 10, '✏️'),
  ('streak_3_days', '3-Day Streak', 'Maintain a journaling streak for 3 days', 25, '🔥'),
  ('streak_7_days', '7-Day Streak', 'Maintain a journaling streak for 7 days', 50, '🌟'),
  ('streak_30_days', '30-Day Streak', 'Maintain a journaling streak for 30 days', 100, '🏆'),
  ('journal_enthusiast', 'Journal Enthusiast', 'Write 10 journal entries', 50, '📚'),
  ('journal_master', 'Journal Master', 'Write 50 journal entries', 150, '📖'),
  ('journal_legend', 'Journal Legend', 'Write 100 journal entries', 250, '🏅'),
  ('super_writer', 'Super Writer', 'Write more than 3 journal entries', 50, '🚀')
ON CONFLICT (id) DO NOTHING;

-- Create user points table
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  entries_count INTEGER NOT NULL DEFAULT 0,
  last_entry_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
