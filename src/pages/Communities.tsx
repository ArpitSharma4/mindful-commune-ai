import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { PostFeatures } from "@/features/community/components";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Leaf, Users, MessageSquare, TrendingUp, Search, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import JournalFeed from "@/features/community/components/CommunityMain";
import CreateCommunityModal from "@/components/CreateCommunityModal";

const Communities = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [communityId, setCommunityId] = useState<number>(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [allCommunities, setAllCommunities] = useState([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [joinedCommunities, setJoinedCommunities] = useState(new Set());

  // Check for navigation state to pre-open post creation
  useEffect(() => {
    if (location.state?.preSelectedCommunityId) {
      setCommunityId(location.state.preSelectedCommunityId);
    }
  }, [location.state]);

  // Refresh posts when returning from CreatePost page
  useEffect(() => {
    if (location.state?.fromCreatePost) {
      setRefreshTrigger(prev => prev + 1);
      // Clear the navigation state to prevent repeated refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Fetch all communities for discover section
  const fetchAllCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      console.log('Fetching all communities from /api/communities');
      const response = await fetch('/api/communities');
      console.log('Communities response status:', response.status);
      
      if (response.ok) {
        const communities = await response.json();
        console.log('Communities data:', communities);
        setAllCommunities(communities);
        
        if (communities.length > 0 && !communityId) {
          console.log('Setting community ID to:', communities[0].community_id);
          setCommunityId(communities[0].community_id);
        }
      } else {
        console.error('Failed to fetch communities, status:', response.status);
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
      setIsLoadingCommunities(false);
    }
  };

  // Fetch joined communities to filter them out
  const fetchJoinedCommunities = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, clearing joined communities');
        setJoinedCommunities(new Set());
        return;
      }
      
      console.log('Fetching joined communities with token');
      const response = await fetch('/api/communities/joined', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Joined communities response status:', response.status);
      
      if (response.ok) {
        const joinedData = await response.json();
        console.log('Joined communities data:', joinedData);
        const joinedIds = new Set();
        joinedData.forEach(community => {
          const id = community.community_id;
          joinedIds.add(id);
          joinedIds.add(String(id));
          joinedIds.add(Number(id));
        });
        console.log('Setting joined communities set:', joinedIds);
        setJoinedCommunities(joinedIds);
      } else {
        console.log('Failed to fetch joined communities, clearing set');
        setJoinedCommunities(new Set());
      }
    } catch (error) {
      console.error('Error fetching joined communities:', error);
      setJoinedCommunities(new Set());
    }
  };

  // Load communities on component mount
  useEffect(() => {
    console.log('Communities component mounted, fetching data...');
    fetchAllCommunities();
    fetchJoinedCommunities();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Auth state changed, refetching joined communities');
      fetchJoinedCommunities();
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Handle joining a community
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

      if (response.ok) {
        setJoinedCommunities(prev => new Set(prev).add(communityId));
        toast({
          title: "Success!",
          description: "You've successfully joined the community!",
          duration: 3000,
        });
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
    }
  };

  const handleCreateCommunity = () => {
    setIsCreateCommunityOpen(true);
  };

  const handleCommunityCreated = (newCommunity: any) => {
    fetchAllCommunities();
    toast({
      title: "Community Created!",
      description: `${newCommunity.name} has been successfully created.`,
      duration: 3000,
    });
  };

  const handleCommunityClick = (communityId: string) => {
    navigate(`/community/${communityId}`);
  };

  // Filter communities for discover section
  const filteredCommunities = allCommunities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (community.description && community.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const communityId = community.community_id;
    const isJoined = joinedCommunities.has(communityId) || 
                     joinedCommunities.has(String(communityId)) || 
                     joinedCommunities.has(Number(communityId));
    
    console.log(`Community ${community.name} (ID: ${communityId}): isJoined=${isJoined}, matchesSearch=${matchesSearch}`);
    
    return matchesSearch && !isJoined;
  });

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
          <div className={isSidebarOpen ? "grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-6" : "grid grid-cols-1 gap-6"}>
            {isSidebarOpen && (
              <div className="relative">
                <div className="sticky top-20 z-10">
                  <LeftSidebar onClose={() => setIsSidebarOpen(false)} />
                </div>
              </div>
            )}
            {/* Main Content */}
            <div className="w-full max-w-screen-xl mx-auto space-y-8">
              {/* Posts Feed */}
              <JournalFeed 
                disableAnimations 
                communityId={communityId}
                key={refreshTrigger}
              />
              
              {/* Discover Communities Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Discover Communities</h2>
                  </div>
                  <Button 
                    variant="therapeutic" 
                    size="sm"
                    onClick={handleCreateCommunity}
                    className="shadow-therapeutic transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Community
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search communities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-muted/50 backdrop-blur-sm border-muted focus:border-primary transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Communities Grid */}
                {isLoadingCommunities ? (
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
                                e.stopPropagation();
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
                              <span>0 members</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>0 posts</span>
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

                {filteredCommunities.length === 0 && !isLoadingCommunities && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {searchTerm ? `No communities found matching "${searchTerm}"` : "No new communities to discover"}
                    </p>
                    {searchTerm && (
                      <Button variant="ghost" onClick={() => setSearchTerm("")} className="mt-2">
                        Clear search
                      </Button>
                    )}
                  </div>
                )}
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

export default Communities;
