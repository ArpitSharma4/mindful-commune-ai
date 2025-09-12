import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, PenTool, Bold, Italic, Strikethrough, Image, List, ListOrdered, Code, User, UserX, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Community {
  community_id: string;
  name: string;
  description: string;
  slug: string;
}

interface RedditStylePostEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  communityId?: string | number;
  preSelectedCommunityId?: string | number;
  preSelectedCommunityName?: string;
}

const RedditStylePostEditor = ({ 
  isOpen, 
  onClose, 
  onPostCreated, 
  communityId,
  preSelectedCommunityId,
  preSelectedCommunityName
}: RedditStylePostEditorProps) => {
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    community: "",
    tags: "",
    isAnonymous: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Fetch communities from backend
  const fetchCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      const response = await fetch('/api/community/');
      
      if (response.ok) {
        const data = await response.json();
        setCommunities(data);
        
        // If communityId prop is provided, pre-select it
        if (communityId && data.length > 0) {
          const targetCommunity = data.find((c: Community) => c.community_id == communityId);
          if (targetCommunity) {
            setFormData(prev => ({ ...prev, community: targetCommunity.community_id }));
          }
        }
      } else {
        console.error('Failed to fetch communities');
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  // Load communities when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchCommunities();
    }
  }, [isOpen]);

  // Handle pre-selected community
  useEffect(() => {
    if (preSelectedCommunityId) {
      setFormData(prev => ({ ...prev, community: preSelectedCommunityId.toString() }));
    }
  }, [preSelectedCommunityId]);

  // Auto-focus title input when editor opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setUploadedFile(file);
  };

  const handleRemoveImage = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Image Removed",
      description: "The uploaded image has been removed.",
      duration: 3000,
    });
  };

  const handleFormatting = (format: string) => {
    if (!contentRef.current) return;
    
    contentRef.current.focus();
    
    try {
      // Use type assertion to avoid TypeScript warnings
      const doc = document as any;
      
      switch (format) {
        case "bold":
          doc.execCommand('bold', false);
          break;
        case "italic":
          doc.execCommand('italic', false);
          break;
        case "strikethrough":
          doc.execCommand('strikeThrough', false);
          break;
        case "bullet":
          doc.execCommand('insertUnorderedList', false);
          break;
        case "numbered":
          doc.execCommand('insertOrderedList', false);
          break;
        case "code":
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            
            if (selectedText) {
              const codeElement = document.createElement('code');
              codeElement.style.backgroundColor = '#f1f5f9';
              codeElement.style.color = '#1e293b';
              codeElement.style.padding = '2px 6px';
              codeElement.style.borderRadius = '4px';
              codeElement.style.fontFamily = 'monospace';
              codeElement.style.fontSize = '0.875em';
              codeElement.textContent = selectedText;
              
              range.deleteContents();
              range.insertNode(codeElement);
            }
          }
          break;
        case "image":
          handleImageUpload();
          break;
      }
    } catch (error) {
      console.error('Formatting error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.community) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and select a community.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const contentText = contentRef.current?.textContent || '';
    if (!contentText.trim()) {
      toast({
        title: "Missing Content",
        description: "Please add some content to your post.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Safe localStorage access
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
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

      // Find the selected community by ID
      const selectedCommunity = communities.find(c => c.community_id === formData.community);
      if (!selectedCommunity) {
        toast({
          title: "Invalid Community",
          description: "Please select a valid community.",
          variant: "destructive",
          duration: 3000,
        });
        setIsSubmitting(false);
        return;
      }

      // Create FormData for submission
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('content', contentText.trim());
      formDataToSend.append('is_posted_anonymously', formData.isAnonymous.toString());
      
      if (uploadedFile) {
        formDataToSend.append('media', uploadedFile);
      }
      
      const response = await fetch(`/api/posts/in/${selectedCommunity.community_id}`, {
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
          community: "",
          tags: "",
          isAnonymous: false
        });
        
        if (contentRef.current) {
          contentRef.current.innerHTML = '';
        }
        
        setUploadedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
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

  const handleCancel = () => {
    setFormData({
      title: "",
      community: "",
      tags: "",
      isAnonymous: false
    });
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (contentRef.current) {
      contentRef.current.innerHTML = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-background border border-border rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PenTool className="h-6 w-6 text-primary" />
          Create Post
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Anonymous/Public Toggle */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Post as</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={!formData.isAnonymous ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, isAnonymous: false }))}
              className="flex items-center gap-2 h-10 px-4 rounded-full"
            >
              <User className="h-4 w-4" />
              Public
            </Button>
            <Button
              type="button"
              variant={formData.isAnonymous ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, isAnonymous: true }))}
              className="flex items-center gap-2 h-10 px-4 rounded-full"
            >
              <UserX className="h-4 w-4" />
              Anonymous
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {formData.isAnonymous 
              ? "Your username will not be shown. Post will appear as 'Anonymous'" 
              : "Your username will be visible to other community members"
            }
          </p>
        </div>

        {/* Community Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {preSelectedCommunityId ? `Posting to r/${preSelectedCommunityName}` : "Select a community *"}
          </Label>
          {preSelectedCommunityId ? (
            <div className="bg-muted/50 border border-muted rounded-lg h-11 px-4 flex items-center text-sm">
              <span className="font-medium">r/{preSelectedCommunityName}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                (Selected from community page)
              </span>
            </div>
          ) : (
            <Select
              value={formData.community}
              onValueChange={(value) => setFormData(prev => ({ ...prev, community: value }))}
              disabled={isLoadingCommunities}
            >
              <SelectTrigger className="bg-muted/50 border-muted focus:border-primary h-11">
                <SelectValue placeholder={isLoadingCommunities ? "Loading communities..." : "Choose a community"} />
              </SelectTrigger>
              <SelectContent>
                {communities.length > 0 ? (
                  communities.map((community) => (
                    <SelectItem key={community.community_id} value={community.community_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">r/{community.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {community.description || "A supportive community"}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    {isLoadingCommunities ? "Loading communities..." : "No communities available"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Title *</Label>
          <Input
            ref={titleInputRef}
            placeholder="What's on your mind?"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="bg-muted/50 border-muted focus:border-primary text-base h-12"
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground">
            {formData.title.length}/300 characters
          </p>
        </div>

        {/* Tags Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tags (optional)</Label>
          <Input
            placeholder="mindfulness, gratitude, peace (comma separated)"
            value={formData.tags}
            onChange={(e) => handleInputChange("tags", e.target.value)}
            className="bg-muted/50 border-muted focus:border-primary h-11"
          />
        </div>

        {/* Content Editor */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Content *</Label>
          
          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-lg border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFormatting("bold")}
              className="h-8 w-8 p-0"
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFormatting("italic")}
              className="h-8 w-8 p-0"
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFormatting("strikethrough")}
              className="h-8 w-8 p-0"
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1 self-center" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFormatting("bullet")}
              className="h-8 w-8 p-0"
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFormatting("numbered")}
              className="h-8 w-8 p-0"
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFormatting("code")}
              className="h-8 w-8 p-0"
              title="Code"
            >
              <Code className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1 self-center" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFormatting("image")}
              className="h-8 w-8 p-0"
              title="Insert Image"
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Image Preview */}
          {uploadedFile && (
            <div className="relative">
              <div className="rounded-lg overflow-hidden border">
                <img 
                  src={URL.createObjectURL(uploadedFile)} 
                  alt="Upload preview" 
                  className="w-full h-auto max-h-64 object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={handleRemoveImage}
                title="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Rich Text Editor */}
          <div
            ref={contentRef}
            contentEditable
            className="min-h-[150px] p-4 bg-muted/50 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            style={{ 
              maxHeight: '400px',
              overflowY: 'auto',
              lineHeight: '1.6'
            }}
            data-placeholder="Share your thoughts, experiences, or ask for support..."
            suppressContentEditableWarning={true}
          />
          
          <style jsx>{`
            div[contenteditable]:empty:before {
              content: attr(data-placeholder);
              color: hsl(var(--muted-foreground));
              pointer-events: none;
            }
            
            div[contenteditable] ul {
              list-style-type: disc;
              margin-left: 20px;
              padding-left: 10px;
            }
            
            div[contenteditable] ol {
              list-style-type: decimal;
              margin-left: 20px;
              padding-left: 10px;
            }
            
            div[contenteditable] li {
              margin: 4px 0;
            }
            
            div[contenteditable] code {
              background-color: #f1f5f9 !important;
              color: #1e293b !important;
              padding: 2px 6px !important;
              border-radius: 4px !important;
              font-family: monospace !important;
              font-size: 0.875em !important;
            }
          `}</style>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
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
    </div>
  );
};

export default RedditStylePostEditor;
