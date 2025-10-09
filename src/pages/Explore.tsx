import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Heart, TrendingUp, Search, Plus, Leaf, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import CreateCommunityModal from "@/components/CreateCommunityModal";
const Explore = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [joinedCommunitiesData, setJoinedCommunitiesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJoined, setIsLoadingJoined] = useState(true);
  const [joinedCommunities, setJoinedCommunities] = useState(new Set());
  const [showAllJoined, setShowAllJoined] = useState(false);
  // Fetch communities from backend
  const fetchCommunities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/communities');
      
      if (response.ok) {
        const data = await response.json();
console.log('✅ ALL COMMUNITIES FETCHED:', data.length, 'communities');
console.log('📋 Communities:', data.map(c => ({ 
  id: c.community_id, 
  name: c.name, 
  creator: c.creator_username,
  member_count: c.member_count,
  post_count: c.post_count
})));
setCommunities(data);
      } else {
        console.error('Failed to fetch communities');
        toast({
          title: "Error",
          description: "Failed to load communities. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Fetch joined communities from backend
  const fetchJoinedCommunities = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Fetching joined communities - token exists:', !!token);
      
      if (!token) {
        console.log('No auth token found, skipping joined communities fetch');
        setJoinedCommunitiesData([]);
        setJoinedCommunities(new Set());
        setIsLoadingJoined(false);
        return;
      }
      
      setIsLoadingJoined(true);
      console.log('Making request to /api/community/joined');
      
      const response = await fetch('/api/communities/joined', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Joined communities response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Joined communities data received:', data);
        console.log('Joined communities with counts:', data.map(c => ({ 
          id: c.community_id, 
          name: c.name, 
          member_count: c.member_count,
          post_count: c.post_count
        })));
        
        setJoinedCommunitiesData(data);
        
        // Update the joined communities set for quick lookup
        const joinedIds = new Set();
        data.forEach(community => {
          const id = community.community_id;
          joinedIds.add(id);
          joinedIds.add(String(id));
          // Removed Number(id) since UUIDs are always strings
        });
        setJoinedCommunities(joinedIds);
        console.log('Updated joined communities set:', joinedIds);
  
      } else if (response.status === 401) {
        console.log('Authentication failed for joined communities');
        // Clear auth data if token is invalid
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setJoinedCommunitiesData([]);
        setJoinedCommunities(new Set());
      } else {
        console.error('Failed to fetch joined communities, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching joined communities:', error);
    } finally {
      setIsLoadingJoined(false);
    }
  };
  // Load communities and joined communities on component mount
  useEffect(() => {
    fetchCommunities();
    fetchJoinedCommunities();
  }, []);

  // Listen for authentication state changes to refetch joined communities
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Auth state changed, refetching joined communities');
      fetchJoinedCommunities();
    };

    // Listen for custom auth events (login/logout)
    window.addEventListener('authStateChanged', handleAuthChange);
    
    // Also listen for storage changes (cross-tab login/logout)
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

/// Filter communities to exclude joined ones and apply search
const filteredCommunities = communities.filter(community => {
  const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (community.description && community.description.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Check if community is joined by comparing both string and number IDs
  const communityId = community.community_id;
  const isJoined = joinedCommunities.has(communityId) || 
                   joinedCommunities.has(String(communityId));
  
  return matchesSearch && !isJoined;
});
// ADD THIS DEBUG LOGGING RIGHT HERE:
console.log('🔍 FILTERING DEBUG:');
console.log('- Total communities available:', communities.length);
console.log('- Joined communities Set:', Array.from(joinedCommunities));
console.log('- Joined communities count:', joinedCommunitiesData.length);
console.log('- Filtered (Discover) communities:', filteredCommunities.length);
console.log('- Discover list:', filteredCommunities.map(c => ({ 
  id: c.community_id, 
  name: c.name, 
  creator: c.creator_username 
})));
console.log('- Discover list:', filteredCommunities.map(c => ({ 
  id: c.community_id, 
  name: c.name, 
  creator: c.creator_username 
})));

// ADD THESE NEW DETAILED LOGS RIGHT HERE (after line 160):
console.log('- All community IDs and their types:', communities.map(c => ({ 
  id: c.community_id, 
  type: typeof c.community_id,
  name: c.name 
})));
console.log('- Checking each community:');
communities.forEach(c => {
  const communityId = c.community_id;
  const isJoined = joinedCommunities.has(communityId) || 
                   joinedCommunities.has(String(communityId)) || 
                   joinedCommunities.has(Number(communityId));
  console.log(`  - ${c.name} (ID: ${communityId}, type: ${typeof communityId}): isJoined = ${isJoined}`);
});

console.log('- Filtered (Discover) communities:', filteredCommunities.length);
console.log('- Discover list:', filteredCommunities.map(c => ({ 
  id: c.community_id, 
  name: c.name, 
  creator: c.creator_username 
})));
  // Get communities to display based on expand state
  const displayedJoinedCommunities = showAllJoined 
    ? joinedCommunitiesData 
    : joinedCommunitiesData.slice(0, 3);
  const handleJoinCommunity = async (communityId: string) => {
    try {
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
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        // Update joined communities state
        setJoinedCommunities(prev => new Set(prev).add(communityId));
        
        // Find the community and add it to joined communities data
        const joinedCommunity = communities.find(c => c.community_id === communityId);
        if (joinedCommunity) {
          setJoinedCommunitiesData(prev => [joinedCommunity, ...prev]);
        }
        
        toast({
          title: "Success! ",
          description: "You've successfully joined the community!",
          duration: 3000,
        });
      } else {
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
    }
  };
  const handleCreateCommunity = () => {
    setIsCreateCommunityOpen(true);
  };
  const handleCommunityCreated = (newCommunity: any) => {
    console.log('New community created:', newCommunity);
    
    fetchCommunities();
    fetchJoinedCommunities(); // Add this line
    
    toast({
      title: "Community Created! ",
      description: `${newCommunity.name} has been successfully created.`,
      duration: 3000,
    });
  };
  const handleCommunityClick = (communityId: string) => {
    navigate(`/community/${communityId}`);
  };
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <div className="w-full px-4 py-12">
          {!isSidebarOpen && (
            <div className="block">
              {/* Vertical rail line split into two segments to avoid the leaf area */}
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
          <div className={isSidebarOpen ? "grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-8" : "grid grid-cols-1 gap-8"}>
            {isSidebarOpen && (
              <div className="sticky top-3 self-start">
                <LeftSidebar onClose={() => setIsSidebarOpen(false)} />
              </div>
            )}
            {/* Main Content */}
            <div className="w-full max-w-screen-xl mx-auto">
              <div className="space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold">
                    Explore Communities
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Discover supportive communities where you can share your journey, find understanding, and connect with others who get it.
                  </p>
                </div>
                {/* Search Bar and Action Buttons */}
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search communities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 bg-muted/50 backdrop-blur-sm border-muted focus:border-primary transition-all duration-300"
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <Button 
                      variant="therapeutic" 
                      size="lg"
                      onClick={handleCreateCommunity}
                      className="shadow-therapeutic transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Community
                    </Button>
                  </div>
                </div>
                {/* Joined Communities Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-6 w-6 text-therapeutic" />
                      <h2 className="text-2xl font-bold">Your Communities</h2>
                      <Badge variant="secondary" className="text-sm">
                        {joinedCommunitiesData.length}
                      </Badge>
                    </div>
                    {joinedCommunitiesData.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllJoined(!showAllJoined)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showAllJoined ? (
                          <>
                            Show Less <ChevronUp className="h-4 w-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Show More ({joinedCommunitiesData.length - 3}) <ChevronDown className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {isLoadingJoined ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardHeader className="pb-3">
                            <div className="h-6 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="h-16 bg-muted rounded"></div>
                            <div className="flex gap-4">
                              <div className="h-4 bg-muted rounded w-20"></div>
                              <div className="h-4 bg-muted rounded w-16"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : joinedCommunitiesData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedJoinedCommunities.map((community) => (
                        <Card 
                          key={`joined-${community.community_id}`} 
                          className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-therapeutic/20 cursor-pointer"
                          onClick={() => handleCommunityClick(community.community_id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">{community.name}</CardTitle>
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  Joined
                                </Badge>
                                {community.creator_username && (
                                  <p className="text-xs text-muted-foreground">
                                    Created by u/{community.creator_username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <CardDescription className="text-sm leading-relaxed">
                              {community.description || "A supportive community for meaningful discussions."}
                            </CardDescription>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{community.member_count ?? 0} members</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{community.post_count ?? 0} posts</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs">
                                #{community.slug}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No communities joined yet</p>
                      <p className="text-sm text-muted-foreground">
                        {localStorage.getItem('authToken') ? 
                          "Join communities below to see them here!" : 
                          "Please log in to join communities"
                        }
                      </p>
                    </div>
                  )}
                </div>
                {/* All Communities Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Discover Communities</h2>
                  </div>
                  
                  {/* Communities Grid */}
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardHeader className="pb-3">
                            <div className="h-6 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="h-16 bg-muted rounded"></div>
                            <div className="flex gap-4">
                              <div className="h-4 bg-muted rounded w-20"></div>
                              <div className="h-4 bg-muted rounded w-16"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCommunities.map((community) => (
                        <Card 
                          key={community.community_id} 
                          className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                          onClick={() => handleCommunityClick(community.community_id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">{community.name}</CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                  Community
                                </Badge>
                                {community.creator_username && (
                                  <p className="text-xs text-muted-foreground">
                                    Created by u/{community.creator_username}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="therapeutic"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click when clicking join button
                                  handleJoinCommunity(community.community_id);
                                }}
                              >
                                Join
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <CardDescription className="text-sm leading-relaxed">
                              {community.description || "A supportive community for meaningful discussions."}
                            </CardDescription>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{community.member_count ?? 0} members</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{community.post_count ?? 0} posts</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs">
                                #{community.slug}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {filteredCommunities.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No communities found matching "{searchTerm}"</p>
                      <Button variant="ghost" onClick={() => setSearchTerm("")} className="mt-2">
                        Clear search
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <CreateCommunityModal
        isOpen={isCreateCommunityOpen}
        onClose={() => setIsCreateCommunityOpen(false)}
        onCommunityCreated={handleCommunityCreated}
      />
    </div>
  );
};
export default Explore;
