import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Code, 
  Quote,
  Type,
  Image as ImageIcon,
  X,
  ChevronDown,
  Leaf
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";

interface Community {
  community_id: string;
  name: string;
  description: string;
  slug: string;
}

const CreatePost = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
    isAnonymous: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRichTextMode, setIsRichTextMode] = useState(true);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Check for pre-selected community and source page from navigation state
  const [sourceRoute, setSourceRoute] = useState<string>('/global-feed');
  const [isFromCommunityPage, setIsFromCommunityPage] = useState<boolean>(false);
  const [lockedCommunityName, setLockedCommunityName] = useState<string>('');

  useEffect(() => {
    const state = location.state as { 
      preSelectedCommunityId?: string; 
      preSelectedCommunityName?: string;
      fromGlobalFeed?: boolean;
      fromCommunity?: string;
    } | null;
    
    console.log('CreatePost navigation state:', state);
    
    if (state?.preSelectedCommunityId) {
      console.log('Setting pre-selected community:', state.preSelectedCommunityId);
      setSelectedCommunity(state.preSelectedCommunityId);
    }
    
    // Check if coming from a community page to lock the community selection
    if (state?.fromCommunity || (state?.preSelectedCommunityId && !state?.fromGlobalFeed)) {
      console.log('Locking community selection:', state?.preSelectedCommunityName);
      setIsFromCommunityPage(true);
      setLockedCommunityName(state?.preSelectedCommunityName || '');
    }
    
    // Determine where to redirect after post creation/cancellation
    if (state?.fromGlobalFeed) {
      setSourceRoute('/global-feed');
    } else if (state?.fromCommunity) {
      setSourceRoute(`/community/${state.fromCommunity}`);
    } else if (state?.preSelectedCommunityId) {
      // If we have a pre-selected community but no explicit source, assume it's from community page
      setSourceRoute(`/community/${state.preSelectedCommunityId}`);
    }
    
    console.log('Source route set to:', sourceRoute);
  }, [location.state]);

  // Fetch communities
  const fetchCommunities = async () => {
    try {
      setIsLoadingCommunities(true);
      console.log('Fetching communities from /api/communities');
      const response = await fetch('/api/communities');
      
      console.log('Communities fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Communities data received:', data);
        setCommunities(data);
        
        if (data.length === 0) {
          toast({
            title: "No Communities Found",
            description: "No communities are available. Create one first in the Explore page.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } else {
        console.error('Failed to fetch communities, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        toast({
          title: "Failed to Load Communities",
          description: "Unable to load communities. Please check if the backend is running.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Network Error",
        description: "Cannot connect to the server. Please ensure the backend is running.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContentChange = () => {
    if (contentEditableRef.current) {
      const htmlContent = contentEditableRef.current.innerHTML;
      // Convert HTML to markdown for backend storage
      const markdownContent = htmlToMarkdown(htmlContent);
      setFormData(prev => ({ ...prev, content: markdownContent }));
    }
  };

  const htmlToMarkdown = (html: string): string => {
    let markdown = html;
    
    // Replace HTML tags with markdown
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
    markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');
    markdown = markdown.replace(/<del>(.*?)<\/del>/g, '~~$1~~');
    markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');
    markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1');
    markdown = markdown.replace(/<br\s*\/?>/g, '\n');
    markdown = markdown.replace(/<div>(.*?)<\/div>/g, '$1\n');
    markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n');
    
    // Clean up extra whitespace and newlines
    markdown = markdown.replace(/\n\s*\n/g, '\n\n').trim();
    
    return markdown;
  };

  const markdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    // Replace markdown with HTML tags
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 5MB.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your post.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!selectedCommunity) {
      toast({
        title: "Community Required",
        description: "Please select a community for your post.",
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

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('content', formData.content.trim());
      formDataToSend.append('is_posted_anonymously', formData.isAnonymous.toString());
      
      if (selectedFile) {
        formDataToSend.append('media', selectedFile);
      }
      
      const response = await fetch(`/api/posts/in/${selectedCommunity}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      console.log('Post creation response status:', response.status);
      const data = await response.json();
      console.log('Post creation response data:', data);

      if (response.ok) {
        console.log('Post created successfully, navigating back to source...');
        toast({
          title: "Post Created!",
          description: "Your post has been shared with the community.",
          duration: 3000,
        });
        
        navigate(sourceRoute, { state: { fromCreatePost: true, refreshPosts: true } });
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

  const formatText = (format: string) => {
    if (!isRichTextMode) {
      // Original markdown mode
      const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      let formattedText = selectedText;
      
      switch (format) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          break;
        case 'strikethrough':
          formattedText = `~~${selectedText}~~`;
          break;
        case 'code':
          formattedText = `\`${selectedText}\``;
          break;
        case 'quote':
          formattedText = `> ${selectedText}`;
          break;
        case 'link':
          formattedText = `[${selectedText}](url)`;
          break;
      }
      
      const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
      setFormData(prev => ({ ...prev, content: newValue }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
      }, 0);
    } else {
      // Rich text mode
      if (!contentEditableRef.current) return;
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      switch (format) {
        case 'bold':
          document.execCommand('bold', false);
          break;
        case 'italic':
          document.execCommand('italic', false);
          break;
        case 'strikethrough':
          document.execCommand('strikeThrough', false);
          break;
        case 'code':
          if (selection.toString()) {
            const code = document.createElement('code');
            code.textContent = selection.toString();
            range.deleteContents();
            range.insertNode(code);
            selection.removeAllRanges();
          }
          break;
        case 'quote':
          const blockquote = document.createElement('blockquote');
          blockquote.style.borderLeft = '4px solid #ccc';
          blockquote.style.paddingLeft = '16px';
          blockquote.style.margin = '8px 0';
          blockquote.style.fontStyle = 'italic';
          if (selection.toString()) {
            blockquote.textContent = selection.toString();
            range.deleteContents();
            range.insertNode(blockquote);
          }
          selection.removeAllRanges();
          break;
        case 'link':
          const url = prompt('Enter URL:');
          if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.textContent = selection.toString() || url;
            link.style.color = '#3b82f6';
            link.style.textDecoration = 'underline';
            range.deleteContents();
            range.insertNode(link);
            selection.removeAllRanges();
          }
          break;
      }
      
      handleContentChange();
      contentEditableRef.current.focus();
    }
  };

  const toggleEditorMode = () => {
    if (isRichTextMode) {
      // Switching to markdown mode
      if (contentEditableRef.current) {
        const htmlContent = contentEditableRef.current.innerHTML;
        const markdownContent = htmlToMarkdown(htmlContent);
        setFormData(prev => ({ ...prev, content: markdownContent }));
      }
    } else {
      // Switching to rich text mode
      if (contentEditableRef.current) {
        const htmlContent = markdownToHtml(formData.content);
        contentEditableRef.current.innerHTML = htmlContent;
      }
    }
    setIsRichTextMode(!isRichTextMode);
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="w-full px-4 py-12">
        {!isSidebarOpen && (
          <div className="block">
            {/* Vertical rail line split into two segments to avoid the leaf area */}
            <div className="fixed left-[2.625rem] top-0 h-[calc(6rem-0.25rem)] w-px bg-border/70 z-40 pointer-events-none" />
            <div className="fixed left-[2.625rem] bottom-0 top-[calc(6rem+2.25rem+0.25rem)] w-px bg-border/70 z-40 pointer-events-none" />
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-6 top-24 z-60 h-10 w-10 rounded-full bg-therapeutic hover:bg-therapeutic/80 text-white shadow"
              aria-label="Open sidebar"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Leaf className="h-5 w-5 text-white" />
            </Button>
          </div>
        )}
        
        <div className={isSidebarOpen ? "grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-8" : "grid grid-cols-1 gap-8"}>
          {isSidebarOpen && (
            <div className="sticky top-3 self-start">
              <LeftSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
          )}

          {/* Main Content */}
          <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-3xl md:text-4xl font-bold animate-fade-in">Create Post</h1>
              <p className="text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Share your thoughts, experiences, and connect with the community
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6 bg-gradient-card p-6 rounded-lg shadow-therapeutic animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {/* Post as Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Post as</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={!formData.isAnonymous ? "therapeutic" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, isAnonymous: false }))}
                      className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                    >
                      Public
                    </Button>
                    <Button
                      type="button"
                      variant={formData.isAnonymous ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, isAnonymous: true }))}
                      className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                    >
                      Anonymous
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.isAnonymous 
                      ? "Your username will not be visible to other community members" 
                      : "Your username will be visible to other community members"
                    }
                  </p>
                </div>

                {/* Community Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select a community *</Label>
                  <div className="space-y-2">
                    <Select
                      value={selectedCommunity}
                      onValueChange={setSelectedCommunity}
                      disabled={isLoadingCommunities}
                    >
                      <SelectTrigger className="bg-muted/50 border-border focus:border-primary transition-colors">
                        <SelectValue placeholder="Choose a community" />
                      </SelectTrigger>
                      <SelectContent>
                        {communities.length > 0 ? (
                          communities.map((community) => (
                            <SelectItem 
                              key={community.community_id} 
                              value={community.community_id}
                            >
                              r/{community.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-communities" disabled>
                            No communities available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isLoadingCommunities && (
                      <p className="text-xs text-muted-foreground">Loading communities...</p>
                    )}
                    {!isLoadingCommunities && communities.length === 0 && (
                      <p className="text-xs text-muted-foreground">No communities found. Please create one first.</p>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Title*</Label>
                  <Input
                    placeholder="What's on your mind?"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    maxLength={300}
                    className="bg-muted/50 border-border focus:border-primary transition-colors"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {formData.title.length}/300 characters
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tags (optional)</Label>
                  <Input
                    placeholder="mindfulness, gratitude, peace (comma separated)"
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    className="bg-muted/50 border-border focus:border-primary transition-colors"
                  />
                  <p className="text-xs text-muted-foreground">Add relevant tags separated by commas</p>
                </div>

                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1 p-2 bg-muted/30 rounded-lg border border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('bold')}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('italic')}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('strikethrough')}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('code')}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('quote')}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText('link')}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <div className="ml-auto">
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleEditorMode}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      {isRichTextMode ? 'Switch to Markdown' : 'Switch to Rich Text'}
                    </Button>
                  </div>
                </div>

                {/* Content Editor */}
                {isRichTextMode ? (
                  <div>
                    <style>{`
                      .rich-text-editor:empty:before {
                        content: attr(data-placeholder);
                        color: #6b7280;
                        pointer-events: none;
                        position: absolute;
                      }
                      .rich-text-editor {
                        position: relative;
                      }
                      .rich-text-editor strong {
                        font-weight: bold;
                      }
                      .rich-text-editor em {
                        font-style: italic;
                      }
                      .rich-text-editor del {
                        text-decoration: line-through;
                      }
                      .rich-text-editor code {
                        background-color: #f3f4f6;
                        padding: 2px 4px;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        font-size: 0.9em;
                      }
                      .rich-text-editor blockquote {
                        border-left: 4px solid #d1d5db;
                        padding-left: 16px;
                        margin: 8px 0;
                        font-style: italic;
                        color: #6b7280;
                      }
                      .rich-text-editor a {
                        color: #3b82f6;
                        text-decoration: underline;
                      }
                    `}</style>
                    <div
                      ref={contentEditableRef}
                      contentEditable
                      onInput={handleContentChange}
                      className="rich-text-editor min-h-[200px] p-3 bg-muted/50 border border-border rounded-md focus:border-primary transition-colors resize-none overflow-auto"
                      style={{
                        outline: 'none',
                        lineHeight: '1.5',
                      }}
                      data-placeholder="Share your thoughts, experiences, or ask for support..."
                      suppressContentEditableWarning={true}
                    />
                  </div>
                ) : (
                  <Textarea
                    id="content-textarea"
                    placeholder="Share your thoughts, experiences, or ask for support..."
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    rows={8}
                    className="resize-none bg-muted/50 border-border focus:border-primary transition-colors"
                  />
                )}
                
                {/* Hidden Image Upload */}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected image: {selectedFile.name}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(sourceRoute)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="therapeutic"
                    disabled={isSubmitting}
                    className="px-8 shadow-therapeutic"
                  >
                    {isSubmitting ? "Posting..." : "Post"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
