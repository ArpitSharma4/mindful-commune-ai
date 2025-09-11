import CommunityPost from "./PostFeatures";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { TrendingUp, Clock, Heart, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import RedditStylePostEditor from "./RedditStylePostEditor";

interface CommunityMainProps {
  onOpenCreatePost?: () => void;
  disableAnimations?: boolean;
}

const CommunityMain = ({ onOpenCreatePost, disableAnimations }: CommunityMainProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const handleShareStory = () => {
    if (onOpenCreatePost) {
      onOpenCreatePost();
      return;
    }
    setIsCreatePostOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsLoading(true);
    // Simulate search delay
    setTimeout(() => setIsLoading(false), 300);
  };

  // Mock data for community posts with dynamic content
  const allPosts = [
    {
      id: "1",
      title: "Finding peace in small moments",
      content: "Today I realized that happiness doesn't always come from big achievements. Sometimes it's found in the quiet moments - like watching the sunrise with my coffee, hearing a favorite song on the radio, or simply taking a deep breath. These little pockets of peace have become my anchors during difficult times. I'm learning to notice them more and hold onto their warmth when anxiety creeps in.",
      author: "Sarah M.",
      isAnonymous: false,
      timeAgo: "2 hours ago",
      upvotes: 24,
      comments: 8,
      tags: ["mindfulness", "gratitude", "peace"],
      community: "r/Mindfulness"
    },
    {
      id: "2",
      title: "The weight of perfectionism",
      content: "I've been struggling with the constant need to be perfect in everything I do. It's exhausting to live with this voice that tells me nothing I do is ever good enough. Today my therapist helped me realize that perfectionism isn't about high standards - it's about fear. Fear of judgment, fear of failure, fear of not being worthy of love. I'm working on showing myself the same compassion I'd show a friend.",
      author: "Anonymous",
      isAnonymous: true,
      timeAgo: "4 hours ago",
      upvotes: 67,
      comments: 23,
      tags: ["perfectionism", "therapy", "self-compassion"],
      community: "r/Therapy"
    },
    {
      id: "3",
      title: "Celebrating small wins in depression recovery",
      content: "It might not seem like much, but I took a shower, made my bed, and even went for a short walk today. A month ago, getting out of bed felt impossible. Recovery isn't linear, and some days are still really hard, but I'm learning to celebrate these moments when I take care of myself. To anyone else fighting this battle - you're not alone, and every small step counts.",
      author: "Alex K.",
      isAnonymous: false,
      timeAgo: "6 hours ago",
      upvotes: 156,
      comments: 42,
      tags: ["depression", "recovery", "self-care", "progress"],
      community: "r/DepressionSupport"
    },
    {
      id: "4",
      title: "Learning to set boundaries",
      content: "I used to think saying 'no' made me a bad person. I would overcommit, burn out, and then resent everyone around me. This week, I practiced setting boundaries with family and friends. It felt scary at first, but I'm starting to see that healthy boundaries actually improve my relationships. People who truly care about me respect my limits.",
      author: "Jordan R.",
      isAnonymous: false,
      timeAgo: "8 hours ago",
      upvotes: 89,
      comments: 31,
      tags: ["boundaries", "relationships", "self-respect"],
      community: "r/Relationships"
    }
  ];

  // Filter posts based on search term
  const getFilteredPosts = () => {
    if (!searchTerm) return allPosts;
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const posts = getFilteredPosts();

  useEffect(() => {
    setFilteredPosts(posts);
  }, [searchTerm, activeTab]);

  return (
    <section className="space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className={`text-3xl md:text-4xl font-bold ${disableAnimations ? '' : 'animate-fade-in'}`}>
            Community Posts
          </h2>
          <p className={`text-lg text-muted-foreground ${disableAnimations ? '' : 'animate-fade-in'}`} style={disableAnimations ? undefined : { animationDelay: '0.2s' }}>
            Share your thoughts, find support, and connect with others. Post anonymously or with your username.
          </p>
        </div>

        {/* Search Bar */}
        <div className={`max-w-md mx-auto ${disableAnimations ? '' : 'animate-fade-in'}`} style={disableAnimations ? undefined : { animationDelay: '0.4s' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search posts, topics, or communities..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10 bg-muted/50 backdrop-blur-sm border-border/60 focus:border-primary transition-all duration-300"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => handleSearch("")}
              >
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Create Post Button */}
        <div className={`flex justify-center ${disableAnimations ? '' : 'animate-fade-in'}`} style={disableAnimations ? undefined : { animationDelay: '0.6s' }}>
          <Button 
            variant="therapeutic" 
            size="lg" 
            className="shadow-therapeutic w-full sm:w-auto max-w-xs sm:max-w-none transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={handleShareStory}
          >
            Create Post
          </Button>
        </div>

        {/* Reddit Style Post Editor (fallback when standalone) */}
        {!onOpenCreatePost && (
          <RedditStylePostEditor 
            isOpen={isCreatePostOpen} 
            onClose={() => setIsCreatePostOpen(false)} 
          />
        )}

        {/* Feed Tabs */}
        <Tabs defaultValue="trending" className={`w-full ${disableAnimations ? '' : 'animate-fade-in'}`} style={disableAnimations ? undefined : { animationDelay: '0.8s' }} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="trending" 
              className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <TrendingUp className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="recent" 
              className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <Clock className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-64 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : posts.length > 0 ? (
              posts.map((post, index) => (
                <div 
                  key={post.id} 
                  className={disableAnimations ? '' : 'animate-fade-in'}
                  style={disableAnimations ? undefined : { animationDelay: `${index * 0.1}s` }}
                >
                    <CommunityPost {...post} disableAnimations={disableAnimations} />
                </div>
              ))
            ) : searchTerm ? (
              <div className="text-center py-12 animate-fade-in">
                <p className="text-muted-foreground">No posts found matching "{searchTerm}"</p>
                <Button variant="ghost" onClick={() => handleSearch("")} className="mt-2">
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No trending posts right now</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-64 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : posts.length > 0 ? (
              posts.slice().reverse().map((post, index) => (
                <div 
                  key={post.id} 
                  className={disableAnimations ? '' : 'animate-fade-in'}
                  style={disableAnimations ? undefined : { animationDelay: `${index * 0.1}s` }}
                >
                  <CommunityPost {...post} disableAnimations={disableAnimations} />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No recent posts available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default CommunityMain;