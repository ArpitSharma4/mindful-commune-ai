import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Reply, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  comment_id: string;
  content: string;
  author_username: string;
  author_id: string;
  created_at: string;
  parent_comment_id?: string;
  replies: Comment[];
  vote_score?: number;
}

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  onCommentCountChange?: (newCount: number) => void;
}

const CommentSection = ({ postId, commentCount, onCommentCountChange }: CommentSectionProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingComments, setVotingComments] = useState<Set<string>>(new Set());
  const [userVotes, setUserVotes] = useState<Map<string, 1 | -1>>(new Map());

  // Fetch comments for the post
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching comments for post ${postId}`);
      
      const response = await fetch(`/api/posts/${postId}/comments`);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Comments data received:', data);
        console.log('Number of comments:', data.length);
        setComments(data);
      } else {
        console.error('Failed to fetch comments, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        toast({
          title: "Failed to Load Comments",
          description: `Server returned ${response.status}. ${errorText}`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server to load comments.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new comment
  const handleCreateComment = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to comment.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        console.log('New comment created:', newCommentData);
        
        setNewComment("");
        fetchComments(); // Refresh comments
        
        // Update comment count
        if (onCommentCountChange) {
          onCommentCountChange(commentCount + 1);
        }
        
        toast({
          title: "Comment Posted",
          description: "Your comment has been added successfully.",
          duration: 3000,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Post Comment",
          description: errorData.error || "An error occurred while posting your comment.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a reply to a comment
  const handleCreateReply = async (parentCommentId: string) => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reply.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Reply Required",
        description: "Please enter a reply.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_comment_id: parentCommentId
        })
      });

      if (response.ok) {
        const newReplyData = await response.json();
        console.log('New reply created:', newReplyData);
        
        setReplyContent("");
        setReplyingTo(null);
        fetchComments(); // Refresh comments
        
        // Update comment count
        if (onCommentCountChange) {
          onCommentCountChange(commentCount + 1);
        }
        
        toast({
          title: "Reply Posted",
          description: "Your reply has been added successfully.",
          duration: 3000,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Post Reply",
          description: errorData.error || "An error occurred while posting your reply.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vote on a comment
  const handleCommentVote = async (commentId: string, voteType: 1 | -1) => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote on comments.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (votingComments.has(commentId)) return;

    try {
      setVotingComments(prev => new Set(prev).add(commentId));
      
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          voteType: voteType
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Vote response:', data);
        
        // Update comment vote score in state
        const updateCommentVoteScore = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.comment_id === commentId) {
              return { ...comment, vote_score: data.newScore };
            }
            if (comment.replies && comment.replies.length > 0) {
              return { ...comment, replies: updateCommentVoteScore(comment.replies) };
            }
            return comment;
          });
        };
        
        setComments(updateCommentVoteScore);
        
        // Update user vote state
        const currentVote = userVotes.get(commentId);
        const newUserVotes = new Map(userVotes);
        
        if (currentVote === voteType) {
          // Remove vote if clicking same vote
          newUserVotes.delete(commentId);
          toast({
            title: voteType === 1 ? "Upvote removed" : "Downvote removed",
            description: "Your vote has been removed.",
            duration: 3000,
          });
        } else {
          // Set new vote
          newUserVotes.set(commentId, voteType);
          toast({
            title: voteType === 1 ? "Comment upvoted! 💙" : "Comment downvoted",
            description: voteType === 1 ? "Thank you for your feedback." : "Your feedback has been recorded.",
            duration: 3000,
          });
        }
        
        setUserVotes(newUserVotes);
      } else {
        const errorData = await response.json();
        toast({
          title: "Voting Failed",
          description: errorData.error || "Unable to record your vote. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setVotingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  // Format time ago
  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const commentDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Render individual comment with replies
  const renderComment = (comment: Comment, isReply = false) => {
    const userVote = userVotes.get(comment.comment_id);
    const isVoting = votingComments.has(comment.comment_id);
    const voteScore = comment.vote_score ?? 0;
    
    return (
      <div key={comment.comment_id} className={`${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''}`}>
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {/* Vote Section for Comments */}
              <div className="flex flex-col items-center gap-1 min-w-[2.5rem]">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${userVote === 1 ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'} ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleCommentVote(comment.comment_id, 1)}
                  disabled={isVoting}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <span className={`text-xs font-medium ${userVote === 1 ? 'text-primary' : userVote === -1 ? 'text-destructive' : 'text-foreground'}`}>
                  {voteScore}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${userVote === -1 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive'} ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleCommentVote(comment.comment_id, -1)}
                  disabled={isVoting}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
              
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {comment.author_username?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">u/{comment.author_username}</span>
                  <span className="text-xs text-muted-foreground">
                    {getTimeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{comment.content}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(comment.comment_id)}
                    className="h-7 px-2 text-xs"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                </div>
                
                {/* Reply form */}
                {replyingTo === comment.comment_id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreateReply(comment.comment_id)}
                        disabled={isSubmitting}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {isSubmitting ? "Posting..." : "Reply"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  // Fetch comments when expanded
  useEffect(() => {
    if (isExpanded && comments.length === 0) {
      console.log('[DEBUG] CommentSection - postId:', postId, 'type:', typeof postId);
      console.log('[DEBUG] CommentSection - commentCount:', commentCount);
      
      if (!postId) {
        console.error('[DEBUG] No postId provided to CommentSection');
        toast({
          title: "Error",
          description: "No post ID available for loading comments.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      fetchComments();
    }
  }, [isExpanded, postId]);

  return (
    <div className="space-y-4">
      {/* Comment toggle button */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{commentCount} comments</span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Expanded comment section */}
      {isExpanded && (
        <div className="space-y-4">
          {/* New comment form */}
          <Card>
            <CardHeader className="pb-3">
              <h4 className="font-medium">Add a comment</h4>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleCreateComment}
                  disabled={isSubmitting || !newComment.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Posting..." : "Comment"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments list */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-16 bg-muted rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
