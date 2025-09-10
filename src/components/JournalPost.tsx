import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, MessageCircle, Share2, MoreHorizontal, Bookmark, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface JournalPostProps {
  id: string;
  title: string;
  content: string;
  author: string;
  isAnonymous: boolean;
  timeAgo: string;
  upvotes: number;
  comments: number;
  tags: string[];
  community: string;
  imageUrl?: string;
}

const JournalPost = ({ 
  title, 
  content, 
  author, 
  isAnonymous, 
  timeAgo, 
  upvotes: initialUpvotes, 
  comments, 
  tags,
  community,
  imageUrl 
}: JournalPostProps) => {
  const { toast } = useToast();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [voteState, setVoteState] = useState<'up' | 'down' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 500) + 50);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleVote = (type: 'up' | 'down') => {
    if (voteState === type) {
      setVoteState(null);
      setUpvotes(type === 'up' ? upvotes - 1 : upvotes + 1);
      toast({
        title: type === 'up' ? "Upvote removed" : "Downvote removed",
        description: "Your vote has been removed.",
      });
    } else {
      if (voteState) {
        setUpvotes(type === 'up' ? upvotes + 2 : upvotes - 2);
      } else {
        setUpvotes(type === 'up' ? upvotes + 1 : upvotes - 1);
      }
      setVoteState(type);
      toast({
        title: type === 'up' ? "Post upvoted! 💙" : "Post downvoted",
        description: type === 'up' ? "Thank you for supporting this story." : "Your feedback has been recorded.",
      });
    }
  };

  const handleComment = () => {
    toast({
      title: "Comments",
      description: "Opening comments section...",
    });
  };

  const handleShare = () => {
    toast({
      title: "Post shared! 🤝",
      description: "This story has been shared with others.",
    });
  };

  const handleMoreOptions = () => {
    toast({
      title: "More options",
      description: "Opening post options...",
    });
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Bookmark removed" : "Post bookmarked! 📚",
      description: isBookmarked ? "Removed from your saved posts." : "Added to your saved posts for later reading.",
    });
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setViewCount(prev => prev + 1);
    }
  };

  const truncatedContent = content.length > 200 ? content.substring(0, 200) + "..." : content;
  const shouldShowReadMore = content.length > 200;

  return (
    <Card className={`w-full bg-gradient-card hover:shadow-therapeutic transition-all duration-500 transform hover:scale-[1.02] ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'} ${isExpanded ? 'shadow-lg' : ''}`}>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Vote Section */}
          <div className="flex flex-col items-center gap-1 min-w-[3rem]">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${voteState === 'up' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
              onClick={() => handleVote('up')}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <span className={`text-sm font-medium ${voteState === 'up' ? 'text-primary' : voteState === 'down' ? 'text-destructive' : 'text-foreground'}`}>
              {upvotes}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${voteState === 'down' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive'}`}
              onClick={() => handleVote('down')}
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
                    {isAnonymous ? "A" : author[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">
                    {isAnonymous ? "Anonymous" : author}
                  </span>
                  {isAnonymous && <Badge variant="secondary" className="ml-2 text-xs">Anonymous</Badge>}
                  <span className="ml-2">• {timeAgo}</span>
                  <span className="ml-2">• {community}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMoreOptions}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold leading-tight">
              {title}
            </h3>

            {/* Content */}
            <div className="text-sm text-foreground leading-relaxed">
              <div className={`transition-all duration-300 ${isExpanded ? 'max-h-none' : 'max-h-32 overflow-hidden'}`}>
                {isExpanded ? content : truncatedContent}
              </div>
              {shouldShowReadMore && (
                <button 
                  onClick={handleExpand}
                  className="text-primary hover:text-primary/80 text-sm font-medium mt-2 transition-colors duration-200"
                >
                  {isExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Image if present */}
            {imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img src={imageUrl} alt="Journal entry" className="w-full h-auto max-h-96 object-cover" />
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-fade-in">
                {tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs hover:bg-primary/20 transition-colors duration-200 cursor-pointer transform hover:scale-105"
                    style={{ animationDelay: `${index * 0.1}s` }}
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
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105" onClick={handleComment}>
              <MessageCircle className="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-12" />
              {comments} comments
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-12" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`transition-all duration-200 hover:scale-105 ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={handleBookmark}
            >
              <Bookmark className={`h-4 w-4 mr-2 transition-all duration-200 ${isBookmarked ? 'fill-current' : ''}`} />
              {isBookmarked ? 'Saved' : 'Save'}
            </Button>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Eye className="h-3 w-3 mr-1" />
            {viewCount} views
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default JournalPost;