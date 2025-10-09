import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CommentSection from "@/components/CommentSection";

interface PostResponse {
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
  community_name?: string;
}

const PostDetail = () => {
  const { postId } = useParams();
  const { toast } = useToast();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVoteScore, setCurrentVoteScore] = useState(0);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      try {
        setIsLoading(true);
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to load post ${postId}`);
        }
        const data = await res.json();
        setPost(data);
        setCurrentVoteScore(data.vote_score || 0);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load post");
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleVote = async (voteType: 1 | -1) => {
    if (!postId || isVoting) return;
    
    setIsVoting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to vote on posts.",
          variant: "destructive",
          duration: 3000,
        });
        setIsVoting(false);
        return;
      }

      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          voteType: voteType
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentVoteScore(data.newScore);
        
        if (userVote === voteType) {
          setUserVote(null);
          toast({
            title: voteType === 1 ? "Upvote removed" : "Downvote removed",
            description: "Your vote has been removed.",
            duration: 3000,
          });
        } else {
          setUserVote(voteType);
          toast({
            title: voteType === 1 ? "Post upvoted! 💙" : "Post downvoted",
            description: voteType === 1 ? "Thank you for supporting this story." : "Your feedback has been recorded.",
            duration: 3000,
          });
        }
      } else {
        toast({
          title: "Voting Failed",
          description: data.error || "Unable to record your vote. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error voting on post:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsVoting(false);
    }
  };

  const processedImageUrl = post?.media_url
    ? (post.media_url.startsWith("http")
        ? post.media_url
        : post.media_url.startsWith("/uploads/")
          ? post.media_url
          : `/uploads/${post.media_url}`)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={"/global-feed"}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Post</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {isLoading && (
          <div className="space-y-4">
            <div className="h-8 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
            <div className="h-48 w-full bg-muted animate-pulse rounded" />
          </div>
        )}

        {error && (
          <div className="text-center text-destructive">{error}</div>
        )}

        {post && (
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${userVote === 1 ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'} ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleVote(1)}
                    disabled={isVoting}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <span className={`text-sm font-medium ${userVote === 1 ? 'text-primary' : userVote === -1 ? 'text-destructive' : 'text-foreground'}`}>
                    {currentVoteScore}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${userVote === -1 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive'} ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleVote(-1)}
                    disabled={isVoting}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">
                      {post.is_posted_anonymously ? "Anonymous" : post.author_username}
                    </span>
                    <span className="ml-2">• {new Date(post.created_at).toLocaleString()}</span>
                    {post.community_name && (
                      <span className="ml-2">• r/{post.community_name}</span>
                    )}
                  </div>

                  <h2 className="text-2xl font-semibold">{post.title}</h2>
                  
                  <div 
                    className="whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />

                  {processedImageUrl && (
                    <img
                      src={processedImageUrl}
                      alt="Post media"
                      className="w-full h-auto rounded"
                    />
                  )}
                </div>
              </div>

              <div className="pt-4 border-t mt-6">
                <CommentSection
                  postId={post.post_id}
                  commentCount={post.comment_count}
                  onCommentCountChange={() => {}}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PostDetail;


