import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { X, PenTool, Bold, Italic, Strikethrough, Superscript, Subscript, Link, Image, Video, List, ListOrdered, Code, Save, User, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RedditStylePostEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

type PostType = "text" | "images" | "link" | "poll";

const RedditStylePostEditor = ({ isOpen, onClose, onPostCreated }: RedditStylePostEditorProps) => {
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<PostType>("text");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    community: "",
    tags: "",
    link: "",
    imageUrl: "",
    videoUrl: "",
    isAnonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const communities = [
    { value: "mindfulness", label: "r/Mindfulness", description: "Find peace in everyday moments" },
    { value: "therapy", label: "r/Therapy", description: "Support and insights from therapy" },
    { value: "depression-support", label: "r/DepressionSupport", description: "Support for depression recovery" },
    { value: "relationships", label: "r/Relationships", description: "Navigating relationships and boundaries" },
    { value: "anxiety-help", label: "r/AnxietyHelp", description: "Coping with anxiety and stress" }
  ];

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
      // Scroll the editor into view without animation
      containerRef.current.scrollIntoView({ behavior: "auto", block: "center" });
    }
  }, [isOpen]);

  // Auto-resize the content textarea to fit text without inner scrolling
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Cap growth to avoid extreme sizes while preventing inner scrollbars
    const maxHeight = Math.round(window.innerHeight * 0.7);
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
  }, [formData.content, isOpen]);

  // Check if there's content for Save Draft button
  useEffect(() => {
    const hasAnyContent = formData.title.trim() || formData.content.trim() || formData.link.trim() || formData.imageUrl.trim() || formData.videoUrl.trim();
    setHasContent(!!hasAnyContent);
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormatting = (format: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "strikethrough":
        formattedText = `~~${selectedText}~~`;
        break;
      case "superscript":
        formattedText = `^${selectedText}`;
        break;
      case "subscript":
        formattedText = `~${selectedText}~`;
        break;
      case "link":
        formattedText = `[${selectedText}](url)`;
        break;
      case "image":
        formattedText = `![${selectedText}](image_url)`;
        break;
      case "video":
        formattedText = `[${selectedText}](video_url)`;
        break;
      case "bullet":
        formattedText = `- ${selectedText}`;
        break;
      case "numbered":
        formattedText = `1. ${selectedText}`;
        break;
      case "code":
        formattedText = `\`${selectedText}\``;
        break;
    }

    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    handleInputChange("content", newValue);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.community) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and select a community.",
        variant: "destructive"
      });
      return;
    }

    if (activeTab === "text" && !formData.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please add some content to your post.",
        variant: "destructive"
      });
      return;
    }

    if (activeTab === "link" && !formData.link.trim()) {
      toast({
        title: "Missing Link",
        description: "Please add a link to your post.",
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
      
      // Reset form
      setFormData({
        title: "",
        content: "",
        community: "",
        tags: "",
        link: "",
        imageUrl: "",
        videoUrl: "",
        isAnonymous: false
      });
      
      onClose();
      onPostCreated?.();
    }, 1500);
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved! 💾",
      description: "Your post has been saved as a draft.",
    });
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      content: "",
      community: "",
      tags: "",
      link: "",
      imageUrl: "",
      videoUrl: "",
      isAnonymous: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div ref={containerRef} className="w-full mb-6">
      <Card className="w-full bg-transparent border-none shadow-none">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              Create post
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground cursor-pointer hover:underline">Drafts</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="hover:bg-primary/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
                Select a community *
              </Label>
              <Select
                value={formData.community}
                onValueChange={(value) => handleInputChange("community", value)}
              >
                <SelectTrigger className="bg-muted/50 border-muted focus:border-primary rounded-full h-11 px-4 text-sm">
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

            {/* Post Type Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PostType)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-transparent border-b text-sm">
                <TabsTrigger value="text" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <PenTool className="h-4 w-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Image className="h-4 w-4" />
                  Images & Video
                </TabsTrigger>
                <TabsTrigger value="link" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Link className="h-4 w-4" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="poll" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <List className="h-4 w-4" />
                  Poll
                </TabsTrigger>
              </TabsList>

              {/* Title Input */}
              <div className="mt-6 space-y-2">
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

              {/* Flair & Tags Chip */}
              <div className="flex items-center">
                <Button type="button" variant="outline" className="rounded-full h-8 px-4 text-sm">
                  Add flair and tags<span className="text-destructive">*</span>
                </Button>
              </div>

              {/* Tab Content */}
              <TabsContent value="text" className="space-y-4">
                {/* Formatting Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border border-muted text-sm">
                  <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("bold")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("italic")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("strikethrough")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Strikethrough"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("superscript")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Superscript"
                  >
                    <Superscript className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("subscript")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Subscript"
                  >
                    <Subscript className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("link")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Link"
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("image")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Image"
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("video")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Video"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("bullet")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("numbered")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormatting("code")}
                    className="h-8 px-2 hover:bg-primary/10"
                    title="Code"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  </div>
                  <span className="text-sm text-muted-foreground cursor-pointer hover:underline">Switch to Markdown Editor</span>
                </div>

                {/* Content Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-medium">
                    Body text*
                  </Label>
                  <Textarea
                    ref={contentRef}
                    id="content"
                    placeholder="Share your thoughts, experiences, or ask for advice..."
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    className="min-h-[120px] bg-muted/50 border-muted focus:border-primary resize-none overflow-hidden text-base rounded-2xl"
                    maxLength={10000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.content.length}/10,000 characters
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl" className="text-sm font-medium">
                      Image URL
                    </Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                      className="bg-muted/50 border-muted focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl" className="text-sm font-medium">
                      Video URL
                    </Label>
                    <Input
                      id="videoUrl"
                      placeholder="https://example.com/video.mp4"
                      value={formData.videoUrl}
                      onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                      className="bg-muted/50 border-muted focus:border-primary"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="link" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link" className="text-sm font-medium">
                    Link *
                  </Label>
                  <Input
                    id="link"
                    placeholder="https://example.com"
                    value={formData.link}
                    onChange={(e) => handleInputChange("link", e.target.value)}
                    className="bg-muted/50 border-muted focus:border-primary"
                  />
                </div>
              </TabsContent>

              <TabsContent value="poll" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Poll creation coming soon!</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/10">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!hasContent}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                type="submit"
                variant="therapeutic"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <PenTool className="h-4 w-4 mr-2" />
                    Post
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

export default RedditStylePostEditor;
