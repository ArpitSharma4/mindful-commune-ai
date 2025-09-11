import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Heart, TrendingUp, Search, Plus, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import CreateCommunityModal from "@/components/CreateCommunityModal";

const Explore = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch communities from backend
  const fetchCommunities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/community/');
      
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
      } else {
        console.error('Failed to fetch communities');
        toast({
          title: "Error",
          description: "Failed to load communities. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load communities on component mount
  useEffect(() => {
    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (community.description && community.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to join communities.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/community/${communityId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success! ",
          description: "You've successfully joined the community!",
        });
      } else {
        toast({
          title: "Join Failed",
          description: data.error || "Failed to join community.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error joining community:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCommunity = () => {
    setIsCreateCommunityOpen(true);
  };

  const handleCommunityCreated = (newCommunity: any) => {
    // Add the new community to the top of the list
    setCommunities(prev => [newCommunity, ...prev]);
    
    toast({
      title: "Community Created! ",
      description: `${newCommunity.name} has been successfully created.`,
    });
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

                {/* Search Bar and Create Button */}
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
                  <div className="flex justify-center">
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
                      <Card key={community.community_id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
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
                              variant="default"
                              size="sm"
                              onClick={() => handleJoinCommunity(community.community_id)}
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

                {filteredCommunities.length === 0 && (
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
