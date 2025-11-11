import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, PenLine, Trophy, Users, Calendar } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  total_points: number;
  postCount: number;
  communityCount: number;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { totalPoints } = useGamification();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/users/profile/${username}`);
        
        if (response.status === 404) {
          throw new Error('Profile not found');
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username, toast]);

  // Calculate level based on points
  const getLevelData = (xp: number) => {
    if (xp < 50) return { level: 1, title: 'Newbie' };
    if (xp < 150) return { level: 2, title: 'Explorer' };
    if (xp < 500) return { level: 3, title: 'Writer' };
    if (xp < 1000) return { level: 4, title: 'Sage' };
    if (xp < 2500) return { level: 5, title: 'Luminary' };
    if (xp < 5000) return { level: 6, title: 'Oracle' };
    return { level: Math.floor(xp / 1000) + 1, title: 'Elder' };
  };

  const levelData = profile ? getLevelData(profile.total_points) : { level: 1, title: 'Newbie' };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <p className="text-muted-foreground mb-4">
          {error || 'The user you\'re looking for doesn\'t exist.'}
        </p>
        <Button onClick={() => window.history.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="w-full md:w-1/3 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h1 className="text-2xl font-bold">{profile.username}</h1>
                  <p className="text-muted-foreground">u/{profile.username}</p>
                </div>
                
                {profile.bio && (
                  <p className="text-center text-muted-foreground">{profile.bio}</p>
                )}

                <div className="w-full space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Level {levelData.level}</span>
                      <span className="text-muted-foreground">{levelData.title}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${(profile.total_points % 1000) / 10}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                      <Zap className="h-5 w-5 text-yellow-500 mb-1" />
                      <span className="text-sm font-medium">{profile.total_points}</span>
                      <span className="text-xs text-muted-foreground">Points</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-500 mb-1" />
                      <span className="text-sm font-medium">{profile.communityCount}</span>
                      <span className="text-xs text-muted-foreground">Communities</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-500 mb-1" />
                      <span className="text-sm font-medium">
                        {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-muted-foreground">Member since</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={() => window.location.href = '/journaling'}>
            <PenLine className="mr-2 h-4 w-4" />
            New Journal Entry
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts ({profile.postCount})</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4 mt-4">
              {profile.postCount > 0 ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-center py-8">
                    User's posts will appear here
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-muted-foreground">No posts yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="achievements" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <h3 className="font-medium">First Entry</h3>
                  <p className="text-sm text-muted-foreground">Write your first journal entry</p>
                </div>
                <div className="text-center p-4 border rounded-lg opacity-50">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <h3 className="font-medium text-muted-foreground">Community Builder</h3>
                  <p className="text-sm text-muted-foreground">Join 5 communities</p>
                </div>
                <div className="text-center p-4 border rounded-lg opacity-50">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <h3 className="font-medium text-muted-foreground">Streak Master</h3>
                  <p className="text-sm text-muted-foreground">Maintain a 7-day streak</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Member Since</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Posts</p>
                        <p className="text-sm text-muted-foreground">{profile.postCount}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Communities</p>
                        <p className="text-sm text-muted-foreground">{profile.communityCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
