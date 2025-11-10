'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, Star, Flame, BookOpenText, Calendar, PenLine, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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

interface GamificationStatus {
  totalPoints: number;
  totalEntries: number;
  currentStreak: number;
  achievements: Achievement[];
}

export default function AchievementsPage() {
  const [status, setStatus] = useState<GamificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seenAchievements, setSeenAchievements] = useState<number[]>([]);
  const navigate = useNavigate();

  // Load seen achievements from localStorage
  useEffect(() => {
    const savedSeen = localStorage.getItem('seenAchievements');
    if (savedSeen) {
      setSeenAchievements(JSON.parse(savedSeen));
    }
  }, []);

  // Fetch achievements status
  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:3000/api/gamification/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load achievements');
        }

        const data = await response.json();
        setStatus(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load achievements');
        toast({
          title: "Error",
          description: "Failed to load achievements",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [navigate]);

  const claimAchievement = (achievementId: number) => {
    const updatedSeen = [...seenAchievements, achievementId];
    setSeenAchievements(updatedSeen);
    localStorage.setItem('seenAchievements', JSON.stringify(updatedSeen));
    
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

  const getAchievementRarity = (points: number) => {
    if (points >= 200) return { label: 'Gold', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    if (points >= 50) return { label: 'Silver', color: 'bg-gray-300', textColor: 'text-gray-300' };
    return { label: 'Bronze', color: 'bg-yellow-700', textColor: 'text-yellow-700' };
  };

  const renderProgressBar = (achievement: Achievement) => {
    if (achievement.isEarned || !status) return null;

    if (achievement.code.includes('STREAK')) {
      const target = parseInt(achievement.code.split('_')[0]);
      const progress = Math.min((status.currentStreak / target) * 100, 100);
      return (
        <div className="mt-2">
          <Progress value={progress} className="h-2 bg-gray-700" />
          <p className="text-xs text-gray-400 mt-1">
            {status.currentStreak} of {target} days
          </p>
        </div>
      );
    }

    if (achievement.code === '10_ENTRIES') {
      const target = 10;
      const progress = Math.min((status.totalEntries / target) * 100, 100);
      return (
        <div className="mt-2">
          <Progress value={progress} className="h-2 bg-gray-700" />
          <p className="text-xs text-gray-400 mt-1">
            {status.totalEntries} of {target} entries
          </p>
        </div>
      );
    }

    return null;
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
        <p className="text-gray-400">No achievements data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-4xl font-bold text-yellow-400">{status.totalPoints}</div>
            <p className="text-gray-400">Total Points</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-4xl font-bold text-blue-400">{status.currentStreak}</div>
            <p className="text-gray-400">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-4xl font-bold text-green-400">{status.totalEntries}</div>
            <p className="text-gray-400">Total Entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {status.achievements.map((achievement) => {
          const isClaimable = achievement.isEarned && !seenAchievements.includes(achievement.id);
          const isClaimed = achievement.isEarned && seenAchievements.includes(achievement.id);
          const rarity = getAchievementRarity(achievement.points);

          return (
            <Card 
              key={achievement.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                isClaimable 
                  ? 'border-yellow-400 shadow-lg shadow-yellow-500/20 animate-pulse' 
                  : 'border-gray-800'
              } ${!achievement.isEarned ? 'opacity-70' : ''} hover:border-gray-600`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className={`flex items-center gap-2 ${
                      !achievement.isEarned ? 'text-gray-400' : 'text-white'
                    }`}>
                      {achievement.isEarned ? (
                        getAchievementIcon(achievement.code)
                      ) : (
                        <Lock className="w-5 h-5 text-gray-500" />
                      )}
                      {achievement.title}
                    </CardTitle>
                    <CardDescription className={`mt-1 ${
                      !achievement.isEarned ? 'text-gray-500' : 'text-gray-300'
                    }`}>
                      {achievement.description}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    isClaimed 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {achievement.points} pts
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                {!achievement.isEarned && renderProgressBar(achievement)}
                
                {isClaimable && (
                  <Button 
                    className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => claimAchievement(achievement.id)}
                  >
                    Claim Reward
                  </Button>
                )}
                
                {isClaimed && achievement.earnedAt && (
                  <div className="text-xs text-green-400 mt-2">
                    Unlocked on {new Date(achievement.earnedAt).toLocaleDateString()}
                  </div>
                )}
                
                {!achievement.isEarned && !renderProgressBar(achievement) && (
                  <div className="text-xs text-gray-500 mt-2">Keep going!</div>
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
    </div>
  );
}
