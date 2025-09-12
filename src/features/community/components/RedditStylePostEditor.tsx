import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, PenTool, Bold, Italic, Strikethrough, Superscript, Subscript, Image, List, ListOrdered, Code, User, UserX, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    community: "",
    tags: "",
    isAnonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Fetch communities from backend
  const fetchCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      console.log('Fetching communities for post editor...');
      const response = await fetch('/api/community/');
      console.log('Communities response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched communities:', data);
        setCommunities(data);
        
        // If preSelectedCommunityId is provided (from community detail page), pre-select it
        if (preSelectedCommunityId && data.length > 0) {
          const targetCommunity = data.find((c: any) => c.community_id == preSelectedCommunityId);
          if (targetCommunity) {
            console.log('Pre-selecting specific community:', targetCommunity);
            setFormData(prev => ({ ...prev, community: targetCommunity.slug }));
          }
        }
        // Otherwise, if communityId prop is provided, pre-select that community
        else if (communityId && data.length > 0) {
          const targetCommunity = data.find((c: any) => c.community_id == communityId);
          if (targetCommunity) {
            console.log('Pre-selecting community:', targetCommunity);
            setFormData(prev => ({ ...prev, community: targetCommunity.slug }));
          }
        }
      } else {
        console.error('Failed to fetch communities for post editor');
        const errorText = await response.text();
        console.error('Error response:', errorText);
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

  // Auto-focus title input when editor opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Ensure the editor is fully visible without manual scrolling
  useEffect(() => {
    if (isOpen && containerRef.current) {
      // Scroll to top of the editor smoothly
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isOpen]);

  // Auto-resize the content editor to fit text without inner scrolling
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    
    // Reset height to auto to get the actual content height
    el.style.height = "auto";
    // Cap growth to avoid extreme sizes while preventing inner scrollbars
    const maxHeight = Math.round(window.innerHeight * 0.5);
    const minHeight = 120;
    const newHeight = Math.max(minHeight, Math.min(el.scrollHeight, maxHeight));
    el.style.height = `${newHeight}px`;
  }, [formData.content, isOpen]);

  // Check which formats are currently active at cursor position
  const updateActiveFormats = () => {
    if (!contentRef.current) return;
    
    const formats = new Set<string>();
    
    try {
      if (document.queryCommandState('bold')) formats.add('bold');
      if (document.queryCommandState('italic')) formats.add('italic');
      if (document.queryCommandState('strikeThrough')) formats.add('strikethrough');
      if (document.queryCommandState('superscript')) formats.add('superscript');
      if (document.queryCommandState('subscript')) formats.add('subscript');
      if (document.queryCommandState('insertUnorderedList')) formats.add('bullet');
      if (document.queryCommandState('insertOrderedList')) formats.add('numbered');
      
      // Check if cursor is inside a code element
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        
        // Traverse up the DOM tree to check for code element
        while (node && node !== contentRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'CODE') {
            formats.add('code');
            break;
          }
          node = node.parentNode;
        }
      }
    } catch (error) {
      // Some browsers may not support all queryCommandState calls
    }
    
    setActiveFormats(formats);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      const content = contentRef.current.innerHTML;
      setFormData(prev => ({
        ...prev,
        content: content
      }));
      updateActiveFormats();
    }
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

    // Create a local URL for preview and store the file
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImage(imageUrl);
      setUploadedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    // Clear the file input
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
      switch (format) {
        case "bold":
          document.execCommand('bold', false);
          break;
        case "italic":
          document.execCommand('italic', false);
          break;
        case "strikethrough":
          document.execCommand('strikeThrough', false);
          break;
        case "superscript":
          document.execCommand('superscript', false);
          break;
        case "subscript":
          document.execCommand('subscript', false);
          break;
        case "bullet":
          // Force bullet list creation
          document.execCommand('formatBlock', false, 'div');
          document.execCommand('insertUnorderedList', false);
          break;
        case "numbered":
          // Force numbered list creation
          document.execCommand('formatBlock', false, 'div');
          document.execCommand('insertOrderedList', false);
          break;
        case "code":
          // Improved code formatting
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            
            if (selectedText) {
              // Create code element with better styling
              const codeElement = document.createElement('code');
              codeElement.style.backgroundColor = '#f1f5f9';
              codeElement.style.color = '#1e293b';
              codeElement.style.padding = '2px 6px';
              codeElement.style.borderRadius = '4px';
              codeElement.style.fontFamily = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';
              codeElement.style.fontSize = '0.875em';
              codeElement.style.border = '1px solid #e2e8f0';
              codeElement.textContent = selectedText;
              
              range.deleteContents();
              range.insertNode(codeElement);
              
              // Move cursor after the code element
              range.setStartAfter(codeElement);
              range.setEndAfter(codeElement);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              // If no text selected, insert code placeholder
              const codeElement = document.createElement('code');
              codeElement.style.backgroundColor = '#f1f5f9';
              codeElement.style.color = '#1e293b';
              codeElement.style.padding = '2px 6px';
              codeElement.style.borderRadius = '4px';
              codeElement.style.fontFamily = 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';
              codeElement.style.fontSize = '0.875em';
              codeElement.style.border = '1px solid #e2e8f0';
              codeElement.textContent = 'code';
              
              range.insertNode(codeElement);
              
              // Select the placeholder text
              range.selectNodeContents(codeElement);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
          break;
        case "image":
          handleImageUpload();
          break;
      }
      setTimeout(() => updateActiveFormats(), 10);
      handleContentChange();
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

    // Get plain text content from the rich text editor
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

      // Find the selected community to get its ID
      const selectedCommunity = communities.find(c => c.slug === formData.community);
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

      // Get HTML content for rich formatting, but send plain text to backend for now
      const htmlContent = contentRef.current?.innerHTML || '';
      
      // Create FormData to match backend multer expectations
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('content', contentText.trim());
      formDataToSend.append('is_posted_anonymously', formData.isAnonymous.toString());
      
      // Add image file if uploaded
      if (uploadedFile) {
        formDataToSend.append('media', uploadedFile);
      }
      
      const response = await fetch(`/api/posts/in/${selectedCommunity.community_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - let browser set it for FormData
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Post Created! ",
          description: "Your post has been shared with the community.",
          duration: 3000,
        });
        
        // Reset form
        setFormData({
          title: "",
          content: "",
          community: "",
          tags: "",
          isAnonymous: false
        });
        
        // Clear the rich text editor
        if (contentRef.current) {
          contentRef.current.innerHTML = '';
        }
        
        // Clear uploaded image
        setUploadedImage(null);
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
      content: "",
      community: "",
      tags: "",
      isAnonymous: false
    });
    setUploadedImage(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="w-full mb-6">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            Create post
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="hover:bg-primary/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Posting Preference */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Post as
            </Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={!formData.isAnonymous ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, isAnonymous: false }))}
                className="flex items-center gap-2 h-10 px-4 rounded-full transition-all duration-200"
              >
                <User className="h-4 w-4" />
                Public
              </Button>
              <Button
                type="button"
                variant={formData.isAnonymous ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, isAnonymous: true }))}
                className="flex items-center gap-2 h-10 px-4 rounded-full transition-all duration-200"
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
            <Label htmlFor="community" className="text-sm font-medium">
              {preSelectedCommunityId ? `Posting to r/${preSelectedCommunityName}` : "Select a community *"}
            </Label>
            {preSelectedCommunityId ? (
              // Show selected community as read-only when coming from specific community
              <div className="bg-muted/50 border border-muted rounded-full h-11 px-4 flex items-center text-sm">
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
                <SelectTrigger className="bg-muted/50 border-muted focus:border-primary rounded-full h-11 px-4 text-sm">
                  <SelectValue placeholder={isLoadingCommunities ? "Loading communities..." : "Choose a community"} />
                </SelectTrigger>
                <SelectContent>
                  {communities.length > 0 ? (
                    communities.map((community: any) => (
                      <SelectItem key={community.community_id} value={community.slug}>
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
            <Label htmlFor="title" className="text-sm font-medium">
              Title*
            </Label>
            <Input
              ref={titleInputRef}
              id="title"
              placeholder="What's on your mind?"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="bg-muted/50 border-muted focus:border-primary text-base rounded-2xl h-12 md:h-14"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/300 characters
            </p>
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags (optional)
            </Label>
            <Input
              id="tags"
              placeholder="mindfulness, gratitude, peace (comma separated)"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
              className="bg-muted/50 border-muted focus:border-primary rounded-full h-11 px-4 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Add relevant tags separated by commas
            </p>
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Content *
            </Label>
            
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-lg border border-muted">
              <Button
                type="button"
                variant={activeFormats.has('bold') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFormatting("bold")}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={activeFormats.has('italic') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFormatting("italic")}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={activeFormats.has('strikethrough') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFormatting("strikethrough")}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={activeFormats.has('superscript') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFormatting("superscript")}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Superscript"
              >
                <Superscript className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={activeFormats.has('subscript') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFormatting("subscript")}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Subscript"
              >
                <Subscript className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1 self-center" />
              <Button
                type="button"
                variant={activeFormats.has('bullet') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFormatting("bullet")}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={activeFormats.has('numbered') ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFormatting("numbered")}
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormatting("code")}
                className="h-8 w-8 p-0 hover:bg-primary/10"
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
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Insert Image"
              >
                <Image className="h-4 w-4" />
              </Button>
            </div>

            {/* Hidden file input for image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image Preview */}
            {uploadedImage && (
              <div className="relative">
                <div className="rounded-lg overflow-hidden border border-muted">
                  <img 
                    src={uploadedImage} 
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

            {/* Rich Text Content Editor */}
            <div
              ref={contentRef}
              contentEditable
              onInput={handleContentChange}
              onKeyUp={updateActiveFormats}
              onMouseUp={updateActiveFormats}
              className="min-h-[120px] p-4 bg-muted/50 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 overflow-y-auto content-editable-placeholder"
              style={{ 
                maxHeight: '50vh',
                lineHeight: '1.6',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: 'normal'
              }}
              data-placeholder="Share your thoughts, experiences, or ask for support..."
              suppressContentEditableWarning={true}
              onFocus={(e) => {
                if (e.target.textContent === '') {
                  e.target.innerHTML = '';
                }
                updateActiveFormats();
              }}
            />
            
            {/* Add CSS styles for proper list display */}
            <style jsx>{`
              .content-editable-placeholder:empty:before {
                content: attr(data-placeholder);
                color: hsl(var(--muted-foreground));
                pointer-events: none;
                position: absolute;
              }
              
              .content-editable-placeholder:focus:empty:before {
                content: attr(data-placeholder);
                color: hsl(var(--muted-foreground));
                opacity: 0.7;
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
                padding-left: 4px;
              }
              
              div[contenteditable] code {
                background-color: #f1f5f9 !important;
                color: #1e293b !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace !important;
                font-size: 0.875em !important;
                border: 1px solid #e2e8f0 !important;
              }
            `}</style>
            
            <p className="text-xs text-muted-foreground">
              Use the formatting toolbar above to style your text. You can make text <strong>bold</strong>, <em>italic</em>, add lists, and more.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-muted">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-6"
              >
                Cancel
              </Button>
            </div>
            <Button
              type="submit"
              variant="therapeutic"
              disabled={isSubmitting}
              className="px-8 shadow-therapeutic"
            >
              {isSubmitting ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RedditStylePostEditor;
