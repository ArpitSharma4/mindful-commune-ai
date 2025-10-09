import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
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
  const [post, setPost] = useState<PostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <CardContent className="p-6 space-y-4">
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

              <div className="pt-4 border-t">
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


