import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, PenTool, Users, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePostModal = ({ isOpen, onClose }: CreatePostModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    community: "",
    isAnonymous: false,
    tags: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const communities = [
    { value: "mindfulness", label: "r/Mindfulness", description: "Find peace in everyday moments" },
    { value: "therapy", label: "r/Therapy", description: "Support and insights from therapy" },
    { value: "depression-support", label: "r/DepressionSupport", description: "Support for depression recovery" },
    { value: "relationships", label: "r/Relationships", description: "Navigating relationships and boundaries" },
    { value: "anxiety-help", label: "r/AnxietyHelp", description: "Coping with anxiety and stress" }
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.community) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Post Created! 🎉",
        description: "Your post has been shared with the community.",
      });
      onClose();
      // Reset form
      setFormData({
        title: "",
        content: "",
        community: "",
        isAnonymous: false,
        tags: ""
      });
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-primary/20 shadow-2xl">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <PenTool className="h-5 w-5 text-primary" />
              Create New Post
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-primary/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title *
              </Label>
              <Input
                id="title"
                placeholder="What's on your mind?"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="bg-muted/50 border-muted focus:border-primary"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/300 characters
              </p>
            </div>

            {/* Community Selection */}
            <div className="space-y-2">
              <Label htmlFor="community" className="text-sm font-medium">
                Community *
              </Label>
              <Select
                value={formData.community}
                onValueChange={(value) => handleInputChange("community", value)}
              >
                <SelectTrigger className="bg-muted/50 border-muted focus:border-primary">
                  <SelectValue placeholder="Choose a community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((community) => (
                    <SelectItem key={community.value} value={community.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{community.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {community.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">
                Your Story *
              </Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts, experiences, or ask for advice..."
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                className="min-h-[200px] bg-muted/50 border-muted focus:border-primary resize-none"
                maxLength={10000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length}/10,000 characters
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium">
                Tags (optional)
              </Label>
              <Input
                id="tags"
                placeholder="Add tags separated by commas (e.g., mindfulness, anxiety, self-care)"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                className="bg-muted/50 border-muted focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Tags help others find your post
              </p>
            </div>

            {/* Anonymous Posting */}
            <div className="flex items-center space-x-2 p-4 bg-muted/30 rounded-lg border border-muted">
              <Checkbox
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => handleInputChange("isAnonymous", checked as boolean)}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="anonymous" className="text-sm font-medium cursor-pointer">
                  Post anonymously
                </Label>
                {formData.isAnonymous ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground ml-2">
                Your username won't be visible to others
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-primary/10">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="therapeutic"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PenTool className="h-4 w-4 mr-2" />
                    Create Post
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePostModal;
