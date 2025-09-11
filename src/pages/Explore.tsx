import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Heart, TrendingUp, Search, Plus, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CreateCommunityModal from "@/components/CreateCommunityModal";

const Explore = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);

  // Mock communities data
  const communities = [
    {
      id: "1",
      name: "Mindfulness & Meditation",
      description: "A supportive space for sharing meditation experiences, mindfulness practices, and finding inner peace.",
      members: 12500,
      posts: 3200,
      category: "Wellness",
      tags: ["meditation", "mindfulness", "peace", "calm"],
      isJoined: false
    },
    {
      id: "2", 
      name: "Depression Support",
      description: "A safe community for those dealing with depression. Share your journey, find support, and know you're not alone.",
      members: 8900,
      posts: 2100,
      category: "Mental Health",
      tags: ["depression", "support", "recovery", "therapy"],
      isJoined: true
    },
    {
      id: "3",
      name: "Anxiety Warriors",
      description: "For those battling anxiety. Share coping strategies, success stories, and support each other through difficult moments.",
      members: 15600,
      posts: 4500,
      category: "Mental Health", 
      tags: ["anxiety", "coping", "strategies", "support"],
      isJoined: false
    },
    {
      id: "4",
      name: "Self-Care Sundays",
      description: "Weekly self-care tips, routines, and motivation. Because taking care of yourself isn't selfish, it's necessary.",
      members: 22000,
      posts: 6800,
      category: "Lifestyle",
      tags: ["self-care", "wellness", "routine", "motivation"],
      isJoined: true
    },
    {
      id: "5",
      name: "Therapy & Counseling",
      description: "Discuss therapy experiences, find resources, and support each other through the therapeutic process.",
      members: 9800,
      posts: 1900,
      category: "Mental Health",
      tags: ["therapy", "counseling", "professional-help", "resources"],
      isJoined: false
    },
    {
      id: "6",
      name: "Gratitude Practice",
      description: "Share what you're grateful for and inspire others to find joy in the little things.",
      members: 18700,
      posts: 5200,
      category: "Wellness",
      tags: ["gratitude", "positivity", "joy", "appreciation"],
      isJoined: false
    },
    {
      id: "7",
      name: "LGBTQ+ Mental Health",
      description: "A supportive space for LGBTQ+ individuals to discuss mental health challenges and celebrate victories.",
      members: 13400,
      posts: 3100,
      category: "Community",
      tags: ["lgbtq", "mental-health", "support", "pride"],
      isJoined: true
    },
    {
      id: "8",
      name: "Work-Life Balance",
      description: "Tips, strategies, and support for maintaining healthy boundaries between work and personal life.",
      members: 16800,
      posts: 4100,
      category: "Lifestyle",
      tags: ["work-life-balance", "boundaries", "productivity", "wellness"],
      isJoined: false
    }
  ];

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleJoinCommunity = (communityId: string) => {
    // Mock join functionality
    console.log(`Joining community ${communityId}`);
  };

  const handleCreateCommunity = () => {
    setIsCreateCommunityOpen(true);
  };

  const handleCommunityCreated = (community: any) => {
    // Handle successful community creation
    console.log('Community created:', community);
    toast({
      title: "Community Created! ",
      description: `${community.name} has been successfully created.`,
    });
    // You can add logic here to refresh community list or navigate to new community
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCommunities.map((community) => (
                    <Card key={community.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{community.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {community.category}
                            </Badge>
                          </div>
                          <Button
                            variant={community.isJoined ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleJoinCommunity(community.id)}
                            className={community.isJoined ? "text-green-600 border-green-600" : ""}
                          >
                            {community.isJoined ? "Joined" : "Join"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <CardDescription className="text-sm leading-relaxed">
                          {community.description}
                        </CardDescription>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{community.members.toLocaleString()} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{community.posts.toLocaleString()} posts</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {community.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {community.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{community.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

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
