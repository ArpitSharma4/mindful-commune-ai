import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUp, ChevronDown, MessageCircle, Share2, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import CommentSection from "@/components/CommentSection";
import EditPostModal from "@/components/EditPostModal";

interface JournalPostProps {
  post_id?: string;
  author_username?: string;
  is_posted_anonymously?: boolean;
  created_at?: string;
  vote_score?: number;
  comment_count?: number;
  media_url?: string;
  media_type?: string;
  id?: string;
  title: string;
  content: string;
  author?: string;
  isAnonymous?: boolean;
  timeAgo?: string;
  upvotes?: number;
  comments?: number;
  tags?: string[];
  community?: string;
  imageUrl?: string;
  disableAnimations?: boolean;
}

const JournalPost = ({ 
  post_id,
  author_username,
  is_posted_anonymously,
  created_at,
  vote_score,
  comment_count,
  media_url,
  media_type,
  id,
  title, 
  content, 
  author, 
  isAnonymous, 
  timeAgo, 
  upvotes: initialUpvotes, 
  comments,
  tags = [],
  community,
  imageUrl,
  disableAnimations
}: JournalPostProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const postId = post_id || id;
  const authorName = is_posted_anonymously ? "Anonymous" : (author_username || author);
  const isAnon = is_posted_anonymously ?? isAnonymous ?? false;
  const voteCount = vote_score ?? initialUpvotes ?? 0;
  const initialCommentCount = comment_count ?? comments ?? 0;
  const mediaSource = media_url || imageUrl;
  
  // Process image URL to ensure it's properly formatted
  const processedImageUrl = mediaSource ? (
    mediaSource.startsWith('http') ? mediaSource : 
    mediaSource.startsWith('/uploads/') ? mediaSource :
    mediaSource.startsWith('/') ? mediaSource :
    `/uploads/${mediaSource}`
  ) : null;

  const [currentVoteScore, setCurrentVoteScore] = useState(voteCount);
  const [currentCommentCount, setCurrentCommentCount] = useState(initialCommentCount);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null); 
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (disableAnimations) {
      setIsVisible(true);
      return;
    }
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [disableAnimations]);

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

  const handleCommentCountChange = (newCount: number) => {
    setCurrentCommentCount(newCount);
  };

  const handleShare = () => {
    toast({
      title: "Post shared! 🤝",
      description: "This story has been shared with others.",
    });
  };

  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handlePostUpdated = (updatedTitle: string, updatedContent: string) => {
    // Update the post data in the parent component
    // This will be handled by the parent component's state management
    window.location.reload(); // Simple approach for now
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const truncatedContent = content.length > 200 ? content.substring(0, 200) + "..." : content;
  const shouldShowReadMore = content.length > 200;

  const goToDetail = () => {
    if (!postId) return;
    navigate(`/post/${postId}`);
  };

  return (
    <Card className={`w-full bg-gradient-card hover:shadow-therapeutic transition-all duration-500 transform hover:scale-[1.02] ${disableAnimations ? '' : (isVisible ? 'animate-fade-in opacity-100' : 'opacity-0')} ${isExpanded ? 'shadow-lg' : ''}`}>
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
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                    {isAnon ? "A" : (authorName?.[0]?.toUpperCase() || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    {authorName || "User"}
                  </span>
                  {isAnon && <Badge variant="secondary" className="ml-2 text-xs">Anonymous</Badge>}
                  <span className="ml-2">• {timeAgo || "just now"}</span>
                  <span className="ml-2">• {community || "r/Community"}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditPost}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Title */}
            <button onClick={goToDetail} className="text-left w-full">
              <h3 className="text-lg font-semibold leading-tight hover:underline">
                {title}
              </h3>
            </button>

            {/* Content */}
            <div className="text-sm text-foreground leading-relaxed">
              <div 
                className={`transition-all duration-300 ${isExpanded ? 'max-h-none' : 'max-h-32 overflow-hidden'} prose prose-sm max-w-none`}
                dangerouslySetInnerHTML={{ 
                  __html: isExpanded ? content : truncatedContent 
                }}
              />
              {shouldShowReadMore && (
                <button 
                  onClick={handleExpand}
                  className="text-primary hover:text-primary/80 text-sm font-medium mt-2 transition-colors duration-200"
                >
                  {isExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Media if present */}
            {processedImageUrl && (
              <div className="rounded-lg overflow-hidden bg-muted/20 cursor-pointer" onClick={goToDetail}>
                {!imageError ? (
                  <>
                    {!imageLoaded && (
                      <div className="w-full h-48 bg-muted/50 animate-pulse flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">Loading image...</span>
                      </div>
                    )}
                    <img 
                      src={processedImageUrl} 
                      alt="Post media" 
                      className={`w-full h-auto max-h-96 object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={(e) => {
                        console.error('Image failed to load:', processedImageUrl);
                        setImageError(true);
                        setImageLoaded(false);
                      }}
                      style={imageLoaded ? {} : { position: 'absolute', visibility: 'hidden' }}
                    />
                  </>
                ) : (
                  <div className="w-full h-48 bg-muted/50 flex items-center justify-center border-2 border-dashed border-muted">
                    <div className="text-center text-muted-foreground">
                      <div className="text-sm">Failed to load image</div>
                      <div className="text-xs mt-1">URL: {processedImageUrl}</div>
                      <div className="text-xs">Image may be corrupted or unavailable</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className={`flex flex-wrap gap-2 ${disableAnimations ? '' : 'animate-fade-in'}`}>
                {tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs hover:bg-primary/20 transition-colors duration-200 cursor-pointer transform hover:scale-105"
                    style={disableAnimations ? undefined : { animationDelay: `${index * 0.1}s` }}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 border-t bg-muted/30 backdrop-blur-sm">
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-12" />
              Share
            </Button>
          </div>
        </div>
      </CardFooter>
      
      {/* Comment Section */}
      {postId && (
        <div className="px-6 pb-6">
          <CommentSection 
            postId={postId} 
            commentCount={currentCommentCount}
            onCommentCountChange={handleCommentCountChange}
          />
        </div>
      )}

      {/* Edit Post Modal */}
      {postId && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          postId={postId}
          currentTitle={title}
          currentContent={content}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </Card>
  );
};

export default JournalPost;