import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, Star, Flame, BookOpenText, Calendar, PenLine, Check, Sparkles, Award, CheckCircle, Zap } from 'lucide-react';
import LevelUpModal from '@/components/gamification/LevelUpModal';
import { useGamification } from '@/contexts/GamificationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';

interface Achievement {
  id: number;
  code: string;
  title: string;
  description: string;
  points: number;
  isEarned: boolean;
  earnedAt: string | null;
}

interface LevelInfo {
  level: number;
  title: string;
  pointsNeeded: number;
  nextLevelPoints: number;
  progress: number;
  xpForNext: number;
  currentXp: number;
}

interface GamificationStatus {
  totalPoints: number;
  totalEntries: number;
  currentStreak: number;
  achievements: Achievement[];
  currentLevel: LevelInfo;
}

// Helper function to define the leveling curve
const getLevelData = (xp: number): LevelInfo => {
  // Level 1 (0-49 XP)
  if (xp < 50) {
    return { 
      level: 1, 
      title: 'Newbie', 
      progress: (xp / 50) * 100, 
      pointsNeeded: 50,
      nextLevelPoints: 50,
      xpForNext: 50, 
      currentXp: xp 
    };
  }
  // Level 2 (50-149 XP)
  if (xp < 150) {
    const xpInLevel = xp - 50;
    const xpToNext = 100; // (150 - 50)
    return { 
      level: 2, 
      title: 'Explorer', 
      progress: (xpInLevel / xpToNext) * 100, 
      pointsNeeded: 150,
      nextLevelPoints: 100,
      xpForNext: 150, 
      currentXp: xpInLevel 
    };
  }
  // Level 3 (150-299 XP)
  if (xp < 300) {
    const xpInLevel = xp - 150;
    const xpToNext = 150; // (300 - 150)
    return { 
      level: 3, 
      title: 'Journalist', 
      progress: (xpInLevel / xpToNext) * 100, 
      pointsNeeded: 300,
      nextLevelPoints: 150,
      xpForNext: 300, 
      currentXp: xpInLevel 
    };
  }
  
  // Default for max level (Level 4+)
  return { 
    level: 4, 
    title: 'Veteran', 
    progress: 100, 
    pointsNeeded: 0, // No more levels after this
    nextLevelPoints: 0,
    xpForNext: 0, 
    currentXp: 0
  };
};

export default function AchievementsPage() {
  const {
    totalPoints,
    totalEntries,
    currentStreak,
    achievements,
    isLoading,
    refreshStatus,
    error
  } = useGamification();
  
  const [seenAchievements, setSeenAchievements] = useState<number[]>([]);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newLevelData, setNewLevelData] = useState({ level: 0, title: '' });
  const navigate = useNavigate();

  // Load seen achievements from localStorage
  useEffect(() => {
    const savedSeen = localStorage.getItem('seenAchievements');
    if (savedSeen) {
      setSeenAchievements(JSON.parse(savedSeen));
    }
  }, []);
  
  // Create a status object to maintain compatibility with existing code
  const status = {
    totalPoints,
    totalEntries,
    currentStreak,
    achievements,
    currentLevel: getLevelData(totalPoints)
  };

  const handleClaim = async (achievement: Achievement) => {
    try {
      // Get points and levels BEFORE claiming
      const oldPoints = totalPoints;
      const oldLevelData = getLevelData(oldPoints);
      
      // Calculate new points and level data
      const newPoints = oldPoints + achievement.points;
      const newLevelData = getLevelData(newPoints);
      
      // Mark as seen in local state and storage
      if (!seenAchievements.includes(achievement.id)) {
        const newSeen = [...seenAchievements, achievement.id];
        setSeenAchievements(newSeen);
        localStorage.setItem('seenAchievements', JSON.stringify(newSeen));
      }
      
      // Make API call to claim the achievement
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:3000/api/gamification/achievements/${achievement.id}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to claim achievement');
      }
      
      // Refresh the global state
      await refreshStatus();
      
      // Check for level up!
      if (newLevelData.level > oldLevelData.level) {
        setNewLevelData({ level: newLevelData.level, title: newLevelData.title });
        setShowLevelUpModal(true);
      }
      
    } catch (error) {
      console.error('Error claiming achievement:', error);
      // Show error toast if needed
    }
  };

  const claimAchievement = (achievementId: number) => {
    const achievement = status?.achievements.find(a => a.id === achievementId);
    if (achievement) {
      handleClaim(achievement);
    }
    
    // Trigger animation or notification
    toast({
      title: "Achievement Claimed!",
      description: "Great job! You've claimed your reward.",
    });
  };

  const getAchievementIcon = (code: string) => {
    const iconClass = 'w-6 h-6';
    
    if (code.includes('STREAK')) {
      return <Flame className={`${iconClass} text-red-400`} />;
    }
    if (code.includes('ENTRY')) {
      return code === 'FIRST_ENTRY' 
        ? <PenLine className={`${iconClass} text-yellow-400`} />
        : <BookOpenText className={`${iconClass} text-blue-400`} />;
    }
    if (code.includes('WEEKLY') || code.includes('MONTHLY')) {
      return <Calendar className={`${iconClass} text-purple-400`} />;
    }
    return <Trophy className={`${iconClass} text-yellow-400`} />;
  };

  const getLevelInfo = (points: number): LevelInfo => {
    const levels = [
      { level: 1, title: 'Newbie', points: 0 },
      { level: 2, title: 'Journalist', points: 50 },
      { level: 3, title: 'Scribe', points: 150 },
      { level: 4, title: 'Author', points: 300 },
      { level: 5, title: 'Lorekeeper', points: 500 },
      { level: 6, title: 'Master', points: 1000 }
    ];

    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length - 1; i++) {
      if (points >= levels[i].points && points < levels[i + 1].points) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1];
        break;
      } else if (i === levels.length - 2 && points >= levels[i + 1].points) {
        currentLevel = levels[levels.length - 1];
        nextLevel = { ...currentLevel, level: currentLevel.level + 1, points: currentLevel.points * 1.5 };
      }
    }

    const progress = nextLevel ? (points - currentLevel.points) / (nextLevel.points - currentLevel.points) * 100 : 100;
    const xpForNext = nextLevel.points - currentLevel.points;
    const currentXp = points - currentLevel.points;
    
    return {
      level: currentLevel.level,
      title: currentLevel.title,
      pointsNeeded: xpForNext,
      nextLevelPoints: nextLevel.points,
      progress: Math.min(progress, 100),
      xpForNext,
      currentXp
    };
  };

  const getAchievementRarity = (points: number) => {
    if (points >= 200) return { 
      label: 'Legendary', 
      color: 'bg-yellow-400', 
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-400',
      shadow: 'shadow-yellow-400/20',
      icon: <Sparkles className="w-3 h-3" />
    };
    if (points >= 50) return { 
      label: 'Rare', 
      color: 'bg-gray-300', 
      textColor: 'text-gray-300',
      borderColor: 'border-gray-300',
      shadow: 'shadow-gray-300/20',
      icon: <Award className="w-3 h-3" />
    };
    return { 
      label: 'Common', 
      color: 'bg-yellow-600', 
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-600',
      shadow: 'shadow-yellow-600/20',
      icon: <Award className="w-3 h-3" />
    };
  };

  const renderProgressBar = (achievement: Achievement) => {
    if (!status) return null;

    // If achievement is already earned, show completion status
    if (achievement.isEarned) {
      return (
        <div className="mt-2 flex items-center text-xs text-green-400">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span>Completed</span>
        </div>
      );
    }

    // Handle different achievement types
    if (achievement.code.includes('STREAK')) {
      const target = parseInt(achievement.code.split('_')[0]);
      const current = Math.min(status.currentStreak, target);
      const progress = Math.min((current / target) * 100, 100);
      
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{current} / {target} days</span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-700" />
        </div>
      );
    }

    if (achievement.code === 'FIRST_ENTRY') {
      const hasEntry = status.totalEntries > 0;
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Status</span>
            <span>{hasEntry ? '1 / 1 entry' : '0 / 1 entry'}</span>
          </div>
          <Progress value={hasEntry ? 100 : 0} className="h-2 bg-gray-700" />
        </div>
      );
    }

    if (achievement.code === '10_ENTRIES') {
      const target = 10;
      const current = Math.min(status.totalEntries, target);
      const progress = Math.min((current / target) * 100, 100);
      
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{current} / {target} entries</span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-700" />
        </div>
      );
    }

    // Default progress for other achievements
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>0%</span>
        </div>
        <Progress value={0} className="h-2 bg-gray-700" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <div className="text-red-500 text-2xl mb-4">Error loading achievements</div>
        <p className="text-gray-400 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <Trophy className="h-12 w-12 text-yellow-400 mb-4" />
          <p className="text-gray-400">Loading your achievements...</p>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(status.totalPoints);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="h-8 w-8 text-yellow-500" />
        Your Achievements
      </h1>
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-yellow-400">{status.totalPoints}</div>
                <p className="text-gray-400">Total Points</p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-full">
                <Trophy className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-blue-400">Level {levelInfo.level}</div>
                <p className="text-gray-400">{levelInfo.title}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full">
                <Star className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress to Level {levelInfo.level + 1}</span>
                <span>{Math.round(levelInfo.progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${levelInfo.progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {status.totalPoints - (levelInfo.level > 1 ? levelInfo.nextLevelPoints - levelInfo.pointsNeeded : 0)} / {levelInfo.nextLevelPoints} XP
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-green-400">{status.currentStreak}</div>
                <p className="text-gray-400">Day Streak</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-full">
                <Flame className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {status.achievements.map((achievement) => {
          const isClaimable = achievement.isEarned && !seenAchievements.includes(achievement.id);
          const isClaimed = achievement.isEarned && seenAchievements.includes(achievement.id);
          const rarity = getAchievementRarity(achievement.points);
          const isLocked = !achievement.isEarned;

          return (
            <Card 
              key={achievement.id}
              className={`relative overflow-hidden transition-all duration-300 border-2 ${
                isClaimable 
                  ? `${rarity.borderColor} shadow-lg ${rarity.shadow} animate-pulse`
                  : isClaimed 
                    ? `${rarity.borderColor} ${rarity.shadow}`
                    : 'border-gray-800 opacity-70'
              } hover:border-gray-600 hover:shadow-md hover:shadow-gray-500/20`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1">
                    <div className="flex justify-between items-start w-full">
                      <CardTitle className={`flex items-center gap-2 ${
                        isLocked ? 'text-gray-400' : 'text-white'
                      }`}>
                        {isLocked ? (
                          <div className="relative">
                            <div className="absolute inset-0 bg-gray-800 rounded-full opacity-70"></div>
                            <div className="relative z-10 w-5 h-5 flex items-center justify-center">
                              <Lock className="w-3 h-3 text-gray-500" />
                            </div>
                          </div>
                        ) : (
                          getAchievementIcon(achievement.code)
                        )}
                        {isLocked ? 'Locked Achievement' : achievement.title}
                      </CardTitle>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isLocked ? 'bg-gray-800 text-gray-500' : rarity.textColor
                      }`}>
                        {!isLocked && rarity.icon}
                        <span>{rarity.label}</span>
                      </div>
                    </div>
                    
                    {!isLocked && (
                      <CardDescription className="mt-1 text-gray-300">
                        {achievement.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className={`ml-2 px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
                    isClaimed 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-gray-800/80 text-gray-400 border border-gray-700'
                  }`}>
                    <span>+{achievement.points}</span>
                    <Star className="w-3 h-3 text-yellow-400" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4 pt-0">
                {isLocked ? (
                  <div className="mt-2">
                    <div className="h-24 bg-gray-900/50 rounded-lg flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="text-4xl mb-2">?</div>
                        <p className="text-xs text-gray-500">Complete challenges to unlock</p>
                      </div>
                    </div>
                    {renderProgressBar(achievement)}
                  </div>
                ) : (
                  <>
                    {isClaimable ? (
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-medium shadow-lg shadow-yellow-500/20"
                        onClick={() => claimAchievement(achievement.id)}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Claim Reward
                      </Button>
                    ) : isClaimed && achievement.earnedAt ? (
                      <div className="flex items-center justify-between mt-4 p-2 bg-green-900/20 rounded-lg border border-green-800/50">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-xs text-green-400">Unlocked</span>
                        </div>
                        <span className="text-xs text-green-400">
                          {new Date(achievement.earnedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
              
              {isClaimed && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
              )}
              
              {isClaimable && (
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent pointer-events-none"></div>
              )}
            </Card>
          );
        })}
      </div>
      {/* Level Up Modal */}
      <LevelUpModal
        isOpen={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        level={newLevelData.level}
        levelName={newLevelData.title}
      />
    </div>
  );
}
