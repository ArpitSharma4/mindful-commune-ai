import React, { useState, useEffect } from 'react';
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
  Save,
  X
} from 'lucide-react';
import { CreateJournalEntryRequest, MoodType, JournalEntry } from '../types';
import { journalService, moodOptions } from '../services';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EditJournalEntryProps {
  entry: JournalEntry;
  onEntryUpdated?: (entry: JournalEntry) => void;
  onCancel?: () => void;
  className?: string;
}

export const EditJournalEntry: React.FC<EditJournalEntryProps> = ({
  entry,
  onEntryUpdated,
  onCancel,
  className
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateJournalEntryRequest>({
    title: entry.title,
    content: entry.content,
    mood: entry.mood
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CreateJournalEntryRequest, value: string | MoodType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      const updatedEntry = await journalService.updateJournalEntry(entry.id, formData);
      
      toast({
        title: "Entry Updated",
        description: "Your journal entry has been updated successfully.",
      });

      onEntryUpdated?.(updatedEntry);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update journal entry. Please try again.",
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

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            Edit Journal Entry
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Entry
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

export default EditJournalEntry;

