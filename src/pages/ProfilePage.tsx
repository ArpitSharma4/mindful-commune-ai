import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, PenLine, Trophy, Users, Calendar, MessageSquare, ArrowUp, ArrowDown, Clock, Loader2, Award, Flame, BookOpen, Star, RefreshCw } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

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

interface Post {
  post_id: string;
  title: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  is_posted_anonymously: boolean;
  community_id: string;
  username: string;
  avatar_url: string | null;
  community_name: string;
  community_slug: string;
  vote_score: number;
  comment_count: number;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { 
    totalPoints, 
    achievements, 
    isLoading: isLoadingGamification, 
    error: gamificationError, 
    refreshStatus 
  } = useGamification();
  
  // Log gamification state for debugging
  useEffect(() => {
    console.log('Gamification state:', {
      isLoading: isLoadingGamification,
      error: gamificationError,
      totalPoints,
      achievementsCount: achievements?.length || 0,
      achievements: achievements,
    });
  }, [isLoadingGamification, gamificationError, totalPoints, achievements]);

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

  const fetchUserPosts = async () => {
    if (!username) return;
    
    setIsLoadingPosts(true);
    try {
      const response = await fetch(`/api/posts/user/${username}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching user posts:', err);
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (profile?.username) {
      fetchUserPosts();
    }
  }, [profile?.username]);

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

  // Filter for unlocked achievements
  // This is the corrected code
const earnedAchievements = achievements?.filter(ach => ach.isEarned) || [];

  // Get achievement icon based on type
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'streak_3_days':
      case 'streak_7_days':
      case 'streak_30_days':
        return <Flame className="h-10 w-10 text-orange-500" />;
      case 'first_entry':
        return <Award className="h-10 w-10 text-yellow-500" />;
      case 'journal_enthusiast':
      case 'journal_master':
      case 'journal_legend':
        return <BookOpen className="h-10 w-10 text-blue-500" />;
      case 'super_writer':
        return <Star className="h-10 w-10 text-purple-500" />;
      default:
        return <Trophy className="h-10 w-10 text-yellow-400" />;
    }
  };

  // Get achievement title based on type
  const getAchievementTitle = (type: string) => {
    const titles: Record<string, string> = {
      'first_entry': 'First Entry',
      'streak_3_days': '3-Day Streak',
      'streak_7_days': '7-Day Streak',
      'streak_30_days': '30-Day Streak',
      'journal_enthusiast': 'Journal Enthusiast',
      'journal_master': 'Journal Master',
      'journal_legend': 'Journal Legend',
      'super_writer': 'Super Writer'
    };
    return titles[type] || 'Achievement Unlocked';
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
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row gap-8 flex-1" style={{ minHeight: 'calc(100vh - 8rem)' }}>
        {/* Left Sidebar */}
        <div className="w-full md:w-1/3 space-y-6 flex flex-col">
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
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="posts" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts ({profile.postCount})</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="flex-1 space-y-4 mt-4 overflow-y-auto">
              {isLoadingPosts ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.post_id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          {!post.is_posted_anonymously && (
                            <div className="flex items-center space-x-1">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={post.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {post.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>u/{post.username}</span>
                            </div>
                          )}
                          {post.is_posted_anonymously && (
                            <div className="flex items-center space-x-1">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-xs">AN</AvatarFallback>
                              </Avatar>
                              <span>Anonymous</span>
                            </div>
                          )}
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                          <span>•</span>
                          <Link 
                            to={`/c/${post.community_slug}`}
                            className="text-blue-500 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            c/{post.community_name}
                          </Link>
                        </div>
                        <CardTitle className="text-lg mt-2">
                          <Link to={`/c/${post.community_slug}/${post.post_id}`} className="hover:underline">
                            {post.title}
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-muted-foreground line-clamp-3">{post.content}</p>
                        
                        {post.media_url && (
                          <div className="mt-3 rounded-md overflow-hidden">
                            {post.media_type?.startsWith('image/') ? (
                              <img 
                                src={post.media_url} 
                                alt="Post media" 
                                className="max-h-96 w-auto max-w-full rounded-md"
                              />
                            ) : post.media_type?.startsWith('video/') ? (
                              <video 
                                src={post.media_url} 
                                controls 
                                className="max-h-96 w-auto max-w-full rounded-md"
                              />
                            ) : null}
                          </div>
                        )}
                        
                        <div className="flex items-center mt-4 pt-2 border-t text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1 mr-4">
                            <ArrowUp className="h-4 w-4" />
                            <span>{post.vote_score}</span>
                          </div>
                          <div className="flex items-center space-x-1 mr-4">
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-muted-foreground">
                    {profile?.username} hasn't posted anything yet
                  </p>
                  {profile?.username === localStorage.getItem('username') && (
                    <Button variant="outline" className="mt-4" asChild>
                      <Link to="/create-post">Create your first post</Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="achievements" className="mt-4 flex-1 overflow-y-auto">
              {isLoadingGamification ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading achievements...</p>
                </div>
              ) : gamificationError ? (
                <div className="text-center p-8">
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
                    <p className="font-medium">Error loading achievements</p>
                    <p className="text-sm mt-1">{gamificationError}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => refreshStatus()}
                    className="mt-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : earnedAchievements.length === 0 ? (
                <div className="text-center p-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium text-muted-foreground">No achievements yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">Start journaling to unlock achievements!</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => refreshStatus()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Again
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earnedAchievements.map((achievement) => (
                    <Card key={achievement.id} className="bg-card hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4 flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getAchievementIcon(achievement.code)}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold">{getAchievementTitle(achievement.code)}</h3>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          {achievement.earnedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Unlocked on {new Date(achievement.earnedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="mt-4 flex-1 overflow-y-auto">
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
    </div>
  );
}
