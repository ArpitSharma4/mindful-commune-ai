import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Brain, Lightbulb } from 'lucide-react';
import { AIFeedback as AIFeedbackType } from '../types';
import { cn } from '@/lib/utils';

interface AIFeedbackProps {
  feedback: AIFeedbackType;
  className?: string;
}

const getFeedbackIcon = (feedback: string) => {
  if (feedback.toLowerCase().includes('grateful') || feedback.toLowerCase().includes('gratitude')) {
    return <Heart className="h-4 w-4 text-pink-500" />;
  }
  if (feedback.toLowerCase().includes('challenge') || feedback.toLowerCase().includes('difficult')) {
    return <Brain className="h-4 w-4 text-blue-500" />;
  }
  if (feedback.toLowerCase().includes('celebrate') || feedback.toLowerCase().includes('congratulations')) {
    return <Lightbulb className="h-4 w-4 text-yellow-500" />;
  }
  return <Sparkles className="h-4 w-4 text-purple-500" />;
};

const getFeedbackCategory = (feedback: string): string => {
  if (feedback.toLowerCase().includes('grateful') || feedback.toLowerCase().includes('gratitude')) {
    return 'Gratitude';
  }
  if (feedback.toLowerCase().includes('challenge') || feedback.toLowerCase().includes('difficult')) {
    return 'Support';
  }
  if (feedback.toLowerCase().includes('celebrate') || feedback.toLowerCase().includes('congratulations')) {
    return 'Celebration';
  }
  if (feedback.toLowerCase().includes('growth') || feedback.toLowerCase().includes('learn')) {
    return 'Growth';
  }
  return 'Reflection';
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Gratitude':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'Support':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Celebration':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Growth':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-purple-100 text-purple-800 border-purple-200';
  }
};

export const AIFeedback: React.FC<AIFeedbackProps> = ({ feedback, className }) => {
  const category = getFeedbackCategory(feedback.feedback);
  const categoryColor = getCategoryColor(category);

  return (
    <Card className={cn(
      "border-l-4 border-l-primary/30 bg-gradient-to-r from-background to-primary/5",
      "hover:shadow-therapeutic transition-all duration-300",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Reflection
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn("text-xs font-medium", categoryColor)}
          >
            {category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getFeedbackIcon(feedback.feedback)}
          </div>
          <div className="flex-1">
            <p className="text-sm leading-relaxed text-foreground/90">
              {feedback.feedback}
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              Generated on {feedback.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIFeedback;
