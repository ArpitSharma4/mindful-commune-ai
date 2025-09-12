import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { X, Upload, User, UserX, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Community {
  community_id: string;
  name: string;
  description: string;
  slug: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  communityId?: string | number;
}

const CreatePostModal = ({ 
  isOpen, 
  onClose, 
  onPostCreated, 
  communityId
}: CreatePostModalProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    community: "",
    isAnonymous: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch communities from backend
  const fetchCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      const response = await fetch('/api/community/');
      
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
        
        // Pre-select community if communityId is provided
        if (communityId && data.length > 0) {
          const targetCommunity = data.find((c: Community) => c.community_id == communityId);
          if (targetCommunity) {
            setFormData(prev => ({ ...prev, community: targetCommunity.community_id }));
          }
        }
      } else {
        console.error('Failed to fetch communities');
        toast({
          title: "Error",
          description: "Failed to load communities. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  // Load communities when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCommunities();
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your post.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please add some content to your post.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!formData.community) {
      toast({
        title: "Community Required",
        description: "Please select a community for your post.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a post.",
          variant: "destructive",
          duration: 3000,
        });
        setIsSubmitting(false);
        return;
      }

      // Create FormData for submission
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('content', formData.content.trim());
      formDataToSend.append('is_posted_anonymously', formData.isAnonymous.toString());
      
      if (selectedFile) {
        formDataToSend.append('media', selectedFile);
      }
      
      const response = await fetch(`/api/posts/in/${formData.community}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Post Created!",
          description: "Your post has been shared with the community.",
          duration: 3000,
        });
        
        // Reset form
        setFormData({
          title: "",
          content: "",
          community: communityId?.toString() || "",
          isAnonymous: false
        });
        
        setSelectedFile(null);
        setImagePreview(null);
        
        onClose();
        onPostCreated?.();
      } else {
        toast({
          title: "Failed to Create Post",
          description: data.error || "An error occurred while creating the post.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      title: "",
      content: "",
      community: communityId?.toString() || "",
      isAnonymous: false
    });
    setSelectedFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            Create Post
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {formData.isAnonymous ? (
                <UserX className="h-5 w-5 text-muted-foreground" />
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
              <div>
                <Label className="text-sm font-medium">
                  {formData.isAnonymous ? "Anonymous Post" : "Public Post"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formData.isAnonymous 
                    ? "Your username will be hidden" 
                    : "Your username will be visible"
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={formData.isAnonymous}
              onCheckedChange={(checked) => handleInputChange("isAnonymous", checked)}
            />
          </div>

          {/* Community Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Community *</Label>
            <Select
              value={formData.community}
              onValueChange={(value) => handleInputChange("community", value)}
              disabled={isLoadingCommunities}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCommunities ? "Loading communities..." : "Select a community"} />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community) => (
                  <SelectItem key={community.community_id} value={community.community_id}>
                    <div className="flex flex-col">
                      <span className="font-medium">r/{community.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {community.description || "A supportive community"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Title *</Label>
            <Input
              placeholder="What's on your mind?"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/300 characters
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Content *</Label>
            <Textarea
              placeholder="Share your thoughts, experiences, or ask for support..."
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Image (optional)</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Upload Image
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile && (
                <span className="text-sm text-muted-foreground">
                  {selectedFile.name}
                </span>
              )}
            </div>
            
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8"
            >
              {isSubmitting ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
