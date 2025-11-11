'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/contexts/GamificationContext';
import { Trophy, Flame, Zap, PenLine } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

interface UserPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function ProfilePage() {
  const { username } = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { totalPoints, currentStreak, isLoading: isLoadingPoints } = useGamification();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${username}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data);
        
        // Fetch user's posts
        const postsResponse = await fetch(`/api/users/${username}/posts`);
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
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

  const levelData = getLevelData(totalPoints);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
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
                  <AvatarImage src={profile.avatar_url} />
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
                        style={{ width: `${(totalPoints % 1000) / 10}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">{totalPoints}</p>
                        <p className="text-xs text-muted-foreground">Points</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">{currentStreak}</p>
                        <p className="text-xs text-muted-foreground">Day Streak</p>
                      </div>
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
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <CardTitle>{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {post.content.length > 150 
                          ? `${post.content.substring(0, 150)}...` 
                          : post.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="achievements">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder for achievements */}
                <div className="text-center p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <h3 className="font-medium">First Entry</h3>
                  <p className="text-sm text-muted-foreground">Write your first journal entry</p>
                </div>
                {/* Add more achievement placeholders */}
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Member Since</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Posts</p>
                        <p className="text-sm text-muted-foreground">{posts.length}</p>
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
