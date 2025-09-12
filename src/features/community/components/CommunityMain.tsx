import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, TrendingUp, Clock, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PostFeatures from "./PostFeatures";
interface CommunityMainProps {
  onOpenCreatePost?: () => void;
  disableAnimations?: boolean;
  communityId?: string | number;
  isGlobalFeed?: boolean;
}
interface Post {
  post_id: string;
  title: string;
  content: string;
  author_username: string;
  is_posted_anonymously: boolean;
  created_at: string;
  vote_score: number;
  comment_count: number;
  media_url?: string;
  media_type?: string;
  // Legacy fields for compatibility
  id?: string;
  author?: string;
  isAnonymous?: boolean;
  timeAgo?: string;
  upvotes?: number;
  comments?: number;
  tags?: string[];
  community?: string;
}
const CommunityMain = ({ onOpenCreatePost, disableAnimations, communityId = 1, isGlobalFeed = false }: CommunityMainProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [communityName, setCommunityName] = useState<string>("Community");
  // Fetch community details to get the name
  const fetchCommunityDetails = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      if (response.ok) {
        const communityData = await response.json();
        setCommunityName(communityData.name);
      }
    } catch (error) {
      console.error('Error fetching community details:', error);
    }
  };
  // Fetch posts from backend - supports both community-specific and global feeds
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      let response;
      
      if (isGlobalFeed) {
        console.log('Fetching recent posts for global feed');
        response = await fetch('/api/posts/recent');
      } else {
        console.log('Fetching posts for community ID:', communityId);
        response = await fetch(`/api/posts/in/${communityId}`);
      }
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched posts data:', data);
        
        if (Array.isArray(data)) {
          // Transform backend data to match our Post interface
          const transformedPosts = data.map((post: any) => ({
            ...post,
            // Map new fields to legacy fields for compatibility
            id: post.post_id,
            author: post.is_posted_anonymously ? "Anonymous" : post.author_username,
            isAnonymous: post.is_posted_anonymously,
            timeAgo: getTimeAgo(post.created_at),
            upvotes: post.vote_score,
            comments: post.comment_count,
            tags: [], // Posts don't have tags in new schema
            community: post.community_name ? `r/${post.community_name}` : `r/${communityName}`
          }));
          console.log('Transformed posts:', transformedPosts);
          setPosts(transformedPosts);
        } else {
          console.log('Data is not an array:', data);
          setPosts([]);
        }
      } else {
        console.error('Failed to fetch posts, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };
  // Helper function to calculate time ago
  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const postDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };
  const handleShareStory = () => {
    if (onOpenCreatePost) {
      onOpenCreatePost();
      return;
    }
    
    // Navigate with appropriate state based on whether this is global feed or community
    const navigationState = isGlobalFeed 
      ? { fromGlobalFeed: true }
      : { fromCommunity: communityId, preSelectedCommunityId: communityId };
    
    navigate('/create-post', { state: navigationState });
  };
  const handlePostCreated = () => {
    // Refresh posts when a new post is created
    fetchPosts();
    toast({
      title: "Post Created Successfully!",
      description: "Your post is now visible in the community feed.",
      duration: 3000,
    });
  };
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsLoading(true);
    // Simulate search delay
    setTimeout(() => setIsLoading(false), 300);
  };
  // Fetch posts based on active tab for global feed
  const fetchPostsByTab = async (tab: string) => {
    if (!isGlobalFeed) {
      return; // For community-specific feeds, use the existing fetchPosts method
    }
    
    try {
      setIsLoading(true);
      const endpoint = tab === 'trending' ? '/api/posts/trending' : '/api/posts/recent';
      console.log(`Fetching ${tab} posts for global feed`);
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched ${tab} posts data:`, data);
        if (Array.isArray(data)) {
          const transformedPosts = data.map((post: any) => ({
            ...post,
            id: post.post_id,
            author: post.is_posted_anonymously ? "Anonymous" : post.author_username,
            isAnonymous: post.is_posted_anonymously,
            timeAgo: getTimeAgo(post.created_at),
            upvotes: post.vote_score,
            comments: post.comment_count,
            tags: [],
            community: post.community_name ? `r/${post.community_name}` : 'r/unknown'
          }));
          setPosts(transformedPosts);
        } else {
          setPosts([]);
        }
      } else {
        console.error(`Failed to fetch ${tab} posts, status:`, response.status);
        setPosts([]);
      }
    } catch (error) {
      console.error(`Error fetching ${tab} posts:`, error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort posts based on search term and active tab
  const getFilteredAndSortedPosts = () => {
    let filteredPosts = posts;
    
    // Apply search filter
    if (searchTerm) {
      filteredPosts = posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    
    // For global feeds, posts are already sorted by the backend
    // For community feeds, apply sorting based on active tab
    if (!isGlobalFeed && activeTab === 'trending') {
      // Sort by vote score (highest first) for trending
      return filteredPosts.sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0));
    } else {
      // Return posts as-is (already sorted from backend)
      return filteredPosts;
    }
  };
  const displayPosts = getFilteredAndSortedPosts();
  // Listen for navigation state changes to refresh posts after creation
  useEffect(() => {
    const state = location.state as { refreshPosts?: boolean; fromCreatePost?: boolean } | null;
    console.log('Navigation state changed:', state);
    if (state?.refreshPosts || state?.fromCreatePost) {
      console.log('Refreshing posts after creation...', { isGlobalFeed, communityId });
      setTimeout(() => {
        if (isGlobalFeed) {
          fetchPostsByTab(activeTab);
        } else {
          fetchPosts();
        }
      }, 100);
      // Clear the state to prevent infinite refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    setFilteredPosts(displayPosts);
  }, [searchTerm, activeTab, posts]);

  // Handle tab changes for global feed
  useEffect(() => {
    if (isGlobalFeed) {
      fetchPostsByTab(activeTab);
    }
  }, [activeTab, isGlobalFeed]);

  // Load community details and posts on component mount and when communityId changes
  useEffect(() => {
    if (!isGlobalFeed) {
      fetchCommunityDetails();
    }
  }, [communityId, isGlobalFeed]);

  useEffect(() => {
    if (isGlobalFeed) {
      // For global feed, fetch posts based on current tab
      fetchPostsByTab(activeTab);
    } else if (communityName !== "Community") {
      // For community feed, fetch community-specific posts
      fetchPosts();
    }
  }, [communityId, communityName, isGlobalFeed]);
  return (
    <section className="space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className={`text-3xl md:text-4xl font-bold ${disableAnimations ? '' : 'animate-fade-in'}`}>
            {isGlobalFeed ? 'Global Feed' : 'Community Posts'}
          </h2>
          <p className={`text-lg text-muted-foreground ${disableAnimations ? '' : 'animate-fade-in'}`} style={disableAnimations ? undefined : { animationDelay: '0.2s' }}>
            {isGlobalFeed 
              ? 'Discover posts from all communities. Connect with the entire mindful community.' 
              : 'Share your thoughts, find support, and connect with others. Post anonymously or with your username.'}
          </p>
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
            ) : displayPosts.length > 0 ? (
              displayPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  className={disableAnimations ? '' : 'animate-fade-in'}
                  style={disableAnimations ? undefined : { animationDelay: `${index * 0.1}s` }}
                >
                  <PostFeatures {...post} disableAnimations={disableAnimations} />
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
                <p className="text-muted-foreground">No posts available yet.</p>
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
            ) : displayPosts.length > 0 ? (
              displayPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  className={disableAnimations ? '' : 'animate-fade-in'}
                  style={disableAnimations ? undefined : { animationDelay: `${index * 0.1}s` }}
                >
                  <PostFeatures {...post} disableAnimations={disableAnimations} />
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
