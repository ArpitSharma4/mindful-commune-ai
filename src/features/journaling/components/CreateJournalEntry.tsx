import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  PenTool, 
  Smile, 
  Frown, 
  Meh, 
  Heart, 
  Zap,
  Sparkles,
  Calendar,
  Save,
  X
} from 'lucide-react';
import { CreateJournalEntryRequest, MoodType, JournalPrompt } from '../types';
import { journalService, journalPrompts, moodOptions } from '../services';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CreateJournalEntryProps {
  onEntryCreated?: (entry: any) => void;
  onCancel?: () => void;
  className?: string;
}

export const CreateJournalEntry: React.FC<CreateJournalEntryProps> = ({
  onEntryCreated,
  onCancel,
  className
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateJournalEntryRequest>({
    title: '',
    content: '',
    mood: 'okay'
  });
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);

  const handleInputChange = (field: keyof CreateJournalEntryRequest, value: string | MoodType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePromptSelect = (prompt: JournalPrompt) => {
    setSelectedPrompt(prompt);
    setFormData(prev => ({ ...prev, content: prompt.text }));
    setShowPrompts(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and content fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // In a real app, you'd get the current user ID from auth context
      const userId = 'user1';
      const newEntry = await journalService.createJournalEntry(formData, userId);
      
      toast({
        title: "Entry Created",
        description: "Your journal entry has been saved successfully.",
      });

      // Reset form
      setFormData({ title: '', content: '', mood: 'okay' });
      setSelectedPrompt(null);
      
      onEntryCreated?.(newEntry);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create journal entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodIcon = (mood: MoodType) => {
    switch (mood) {
      case 'great':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'good':
        return <Smile className="h-4 w-4 text-green-500" />;
      case 'okay':
        return <Meh className="h-4 w-4 text-yellow-500" />;
      case 'bad':
        return <Frown className="h-4 w-4 text-orange-500" />;
      case 'awful':
        return <Frown className="h-4 w-4 text-red-600" />;
      default:
        return <Meh className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPromptCategoryColor = (category: string): string => {
    switch (category) {
      case 'gratitude':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'reflection':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'growth':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'challenge':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'celebration':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            New Journal Entry
          </CardTitle>
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What's on your mind today?"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="text-base"
            />
          </div>

          {/* Mood Selector */}
          <div className="space-y-3">
            <Label>How are you feeling?</Label>
            <div className="flex gap-2 flex-wrap">
              {moodOptions.map((mood) => (
                <Button
                  key={mood.value}
                  type="button"
                  variant={formData.mood === mood.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('mood', mood.value)}
                  className={cn(
                    "flex items-center gap-2",
                    formData.mood === mood.value && "shadow-therapeutic"
                  )}
                >
                  {getMoodIcon(mood.value)}
                  <span className="hidden sm:inline">{mood.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Prompts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Writing Prompts</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPrompts(!showPrompts)}
                className="text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {showPrompts ? 'Hide' : 'Show'} Prompts
              </Button>
            </div>
            
            {showPrompts && (
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {journalPrompts.map((prompt) => (
                  <Button
                    key={prompt.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePromptSelect(prompt)}
                    className="justify-start text-left h-auto p-3"
                  >
                    <div className="flex items-start gap-2 w-full">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs shrink-0", getPromptCategoryColor(prompt.category))}
                      >
                        {prompt.category}
                      </Badge>
                      <span className="text-sm">{prompt.text}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <Label htmlFor="content">Your Thoughts</Label>
            <Textarea
              id="content"
              placeholder="Write about your day, thoughts, feelings, or anything that's on your mind..."
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="min-h-[200px] text-base resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {formData.content.length} characters
            </div>
          </div>

          {/* Selected Prompt Display */}
          {selectedPrompt && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Using prompt:</span>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getPromptCategoryColor(selectedPrompt.category))}
                >
                  {selectedPrompt.category}
                </Badge>
              </div>
              <p className="text-sm mt-1 text-muted-foreground">
                {selectedPrompt.text}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              className="flex-1"
              variant="therapeutic"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Entry
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateJournalEntry;
