import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
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
  imageUrl 
}: JournalPostProps) => {
  const { toast } = useToast();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [voteState, setVoteState] = useState<'up' | 'down' | null>(null);

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

  return (
    <Card className="w-full bg-gradient-card animate-fade-in hover:shadow-therapeutic transition-all duration-300">
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
              {content}
            </div>

            {/* Image if present */}
            {imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img src={imageUrl} alt="Journal entry" className="w-full h-auto max-h-96 object-cover" />
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 border-t bg-muted/30">
        <div className="flex gap-4 w-full">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleComment}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {comments} comments
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default JournalPost;