import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  currentTitle: string;
  currentContent: string;
  onPostUpdated: (updatedTitle: string, updatedContent: string) => void;
}

const EditPostModal = ({
  isOpen,
  onClose,
  postId,
  currentTitle,
  currentContent,
  onPostUpdated,
}: EditPostModalProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(currentTitle);
  const [content, setContent] = useState(currentContent);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setContent(currentContent);
    }
  }, [isOpen, currentTitle, currentContent]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Both title and content are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to edit posts.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Post Updated! ✏️",
          description: "Your post has been successfully updated.",
        });
        onPostUpdated(title.trim(), content.trim());
        onClose();
      } else {
        toast({
          title: "Update Failed",
          description: data.error || "Unable to update post. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Make changes to your post. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              maxLength={200}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[200px]"
              maxLength={5000}
            />
            <div className="text-sm text-muted-foreground text-right">
              {content.length}/5000 characters
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
