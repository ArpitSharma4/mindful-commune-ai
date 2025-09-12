import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import CommunityMain from "@/features/community/components/CommunityMain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, ArrowLeft, Leaf, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
interface Community {
  community_id: string;
  name: string;
  description: string;
  slug: string;
  creator_username: string;
  created_at: string;
  member_count?: number;
  post_count?: number;
}
const CommunityDetail = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  // Fetch community details
  const fetchCommunityDetails = async () => {
    if (!communityId) return;
    
    try {
      setIsLoading(true);
      console.log('Fetching community details for ID:', communityId);
      const response = await fetch(`/api/community/${communityId}`);
      console.log('Community detail response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Community detail data:', data);
        setCommunity(data);
      } else if (response.status === 404) {
        console.error('Community not found - 404');
        const errorData = await response.json();
        console.error('404 Error details:', errorData);
        toast({
          title: "Community Not Found",
          description: "The community you're looking for doesn't exist.",
          variant: "destructive",
          duration: 3000,
        });
        navigate('/explore');
      } else {
        console.error('Failed to fetch community, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch community');
      }
    } catch (error) {
      console.error('Error fetching community:', error);
      toast({
        title: "Error",
        description: "Failed to load community details.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Check if user has joined this community
  const checkMembershipStatus = async () => {
    const token = localStorage.getItem('authToken');
    if (!token || !communityId) return;
    try {
      const response = await fetch('/api/community/joined', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const joinedCommunities = await response.json();
        const isUserJoined = joinedCommunities.some((c: Community) => c.community_id === communityId);
        setIsJoined(isUserJoined);
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };
  // Handle joining community
  const handleJoinCommunity = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join communities.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    if (!communityId) return;
    try {
      setIsJoining(true);
      const response = await fetch(`/api/community/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setIsJoined(true);
        toast({
          title: "Success!",
          description: "You've successfully joined the community!",
          duration: 3000,
        });
        // Refresh community details to update member count
        fetchCommunityDetails();
      } else {
        const data = await response.json();
        toast({
          title: "Join Failed",
          description: data.error || "Failed to join community.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error joining community:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsJoining(false);
    }
  };
  // Handle leaving community
  const handleLeaveCommunity = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to leave communities.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    if (!communityId) return;
    try {
      setIsJoining(true);
      // Note: You'll need to implement the leave endpoint in backend
      const response = await fetch(`/api/community/${communityId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setIsJoined(false);
        toast({
          title: "Left Community",
          description: "You've successfully left the community.",
          duration: 3000,
        });
        // Refresh community details to update member count
        fetchCommunityDetails();
      } else {
        const data = await response.json();
        toast({
          title: "Leave Failed",
          description: data.error || "Failed to leave community.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsJoining(false);
    }
  };
  const handleCreatePost = () => {
    // Navigate to Communities page to create post
    navigate('/communities');
  };
  useEffect(() => {
    fetchCommunityDetails();
    checkMembershipStatus();
  }, [communityId]);
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <div className="w-full px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  if (!community) {
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          <div className="w-full px-4 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl font-bold mb-4">Community Not Found</h1>
              <Button onClick={() => navigate('/explore')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explore
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="w-full px-4 py-12">
          {!isSidebarOpen && (
            <div className="block">
              <div className="fixed left-[2.625rem] top-0 h-[calc(6rem-0.25rem)] w-px bg-border/70 z-40 pointer-events-none" />
              <div className="fixed left-[2.625rem] bottom-0 top-[calc(6rem+2.25rem+0.25rem)] w-px bg-border/70 z-40 pointer-events-none" />
              <Button
                variant="ghost"
                size="icon"
                className="fixed left-6 top-24 z-60 h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow"
                aria-label="Open sidebar"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Leaf className="h-5 w-5 text-white" />
              </Button>
            </div>
          )}
          <div className={isSidebarOpen ? "grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-6" : "grid grid-cols-1 gap-6"}>
            {isSidebarOpen && (
              <div className="relative">
                <div className="sticky top-20 z-10">
                  <LeftSidebar onClose={() => setIsSidebarOpen(false)} />
                </div>
              </div>
            )}
            
            {/* Main Content */}
            <div className="w-full max-w-4xl mx-auto space-y-8">
              {/* Back Button */}
              <Button 
                variant="ghost" 
                onClick={() => navigate('/explore')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explore
              </Button>
              {/* Community Header */}
              <Card className="border-therapeutic/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl font-bold">r/{community.name}</CardTitle>
                      <CardDescription className="text-lg">
                        {community.description || "A supportive community for meaningful discussions."}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground">
                        Created by u/{community.creator_username}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="therapeutic"
                        size="lg"
                        onClick={handleCreatePost}
                        className="shadow-therapeutic"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Post
                      </Button>
                      <Button
                        variant={isJoined ? "destructive" : "therapeutic"}
                        size="lg"
                        onClick={isJoined ? handleLeaveCommunity : handleJoinCommunity}
                        disabled={isJoining}
                        className="shadow-therapeutic"
                      >
                        {isJoining ? "Processing..." : isJoined ? "Leave Community" : "Join Community"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{community.member_count || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>{community.post_count || 0} posts</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{community.slug}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Community Posts Section */}
          {community && (
            <div className="mt-8">
              <CommunityMain 
                communityId={community.community_id}
                disableAnimations={false}
                isGlobalFeed={false}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default CommunityDetail;
