import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, X, Star, Book, Flame, Trophy, Zap, Check, Lock, BookOpenText, Award, Calendar, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface Achievement {
  id: number;
  code: string;
  title: string;
  description: string;
  points: number;
  isEarned: boolean;
  earnedAt: string | null;
  icon?: string;
}

interface GamificationStatus {
  totalPoints: number;
  totalEntries: number;
  currentStreak: number;
  achievements: Achievement[];
}

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<GamificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getAchievementIcon = (code: string, isEarned: boolean) => {
    if (!isEarned) return <Lock className="w-5 h-5 text-gray-500" />;
    
    const iconClass = 'w-5 h-5';
    
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

  const getAchievementRarity = (points: number) => {
    if (points >= 200) return { label: 'Gold', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    if (points >= 50) return { label: 'Silver', color: 'bg-gray-300', textColor: 'text-gray-300' };
    return { label: 'Bronze', color: 'bg-yellow-700', textColor: 'text-yellow-700' };
  };

  const renderProgressBar = (achievement: Achievement) => {
    if (achievement.isEarned || !status) return null;

    const { code } = achievement;
    let goal = 0;
    let progress = 0;
    let progressText = 'Complete challenges to unlock';

    // --- THIS IS THE FIX ---
    // These 'case' strings now EXACTLY match your database
    switch (code) {
      case '3_DAY_STREAK':
        goal = 3;
        progress = status.currentStreak;
        progressText = `${progress} of ${goal} days`;
        break;
      case 'WEEKLY_STREAK':
        goal = 7;
        progress = status.currentStreak;
        progressText = `${progress} of ${goal} days`;
        break;
      case 'MONTHLY_STREAK':
        goal = 30;
        progress = status.currentStreak;
        progressText = `${progress} of ${goal} days`;
        break;
      case 'FIRST_ENTRY':
        goal = 1;
        progress = status.totalEntries >= goal ? 1 : 0;
        progressText = progress >= goal ? 'Completed' : 'Write your first entry';
        break;
      case '10_ENTRIES':
        goal = 10;
        progress = status.totalEntries;
        progressText = `${progress} of ${goal} entries`;
        break;
      // Add any other codes you have in your database here
      default:
        progressText = achievement.description || 'Complete to unlock';
    }

    return (
      <div className="mt-2">
        <Progress 
          value={goal > 0 ? (progress / goal) * 100 : 0} 
          className="h-2 bg-gray-700" 
        />
        <p className="text-xs text-gray-400 mt-1">
          {progressText}
        </p>
      </div>
    );
  };

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }

        const response = await fetch('http://localhost:3000/api/gamification/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to load achievements');
        }

        const data = await response.json();
        setStatus(data);
      } catch (err: any) {
        console.error('Failed to fetch gamification status:', err);
        setError(err.message || 'Could not load achievements');
        toast({
          title: "Error",
          description: "Failed to load achievements. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Your Achievements
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-12 w-12 text-blue-400" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4 text-white border-gray-600 hover:bg-gray-800"
            >
              Try Again
            </Button>
          </div>
        ) : status ? (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                  <Star className="w-5 h-5" /> {status.totalPoints}
                </div>
                <div className="text-sm text-gray-400">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 flex items-center justify-center gap-2">
                  <Flame className="w-5 h-5" /> {status.currentStreak}
                </div>
                <div className="text-sm text-gray-400">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 flex items-center justify-center gap-2">
                  <Book className="w-5 h-5" /> {status.totalEntries}
                </div>
                <div className="text-sm text-gray-400">Entries</div>
              </div>
            </div>

            {/* Achievements List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {status.achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`relative p-4 rounded-lg transition-all duration-200 ${
                    achievement.isEarned 
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-lg shadow-yellow-500/10'
                      : 'bg-gray-800/60 opacity-70'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 p-2 mr-4 rounded-full ${
                      achievement.isEarned ? 'bg-yellow-500/20' : 'bg-gray-700'
                    }`}>
                      {getAchievementIcon(achievement.code, achievement.isEarned)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          achievement.isEarned ? 'text-white' : 'text-gray-400'
                        }`}>
                          {achievement.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {achievement.isEarned && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              getAchievementRarity(achievement.points).color
                            } bg-opacity-20 ${getAchievementRarity(achievement.points).textColor}`}>
                              {getAchievementRarity(achievement.points).label}
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-500/20 text-yellow-400">
                            {achievement.points} pts
                          </span>
                        </div>
                      </div>
                      <p className={`mt-1 text-sm ${
                        achievement.isEarned ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {achievement.description}
                      </p>
                      
                      {renderProgressBar(achievement)}
                      
                      {!achievement.isEarned && !renderProgressBar(achievement) && (
                        <p className="mt-2 text-xs text-gray-500">Keep going!</p>
                      )}
                      
                      {achievement.isEarned && achievement.earnedAt && (
                        <p className="mt-2 text-xs text-green-400">
                          Unlocked on {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {achievement.isEarned && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default AchievementsModal;
