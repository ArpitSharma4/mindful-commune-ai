import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  Heart, 
  Smile, 
  Frown, 
  Meh,
  Sparkles,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { JournalEntry, MoodType } from '../types';
import { journalService } from '../services';
import { AIFeedback } from './AIFeedback';
import { EditJournalEntry } from './EditJournalEntry';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface JournalFeedProps {
  onCreateEntry?: () => void;
  className?: string;
  refreshKey?: number; // Add refreshKey prop
}

export const JournalFeed: React.FC<JournalFeedProps> = ({
  onCreateEntry,
  className,
  refreshKey = 0 // Default to 0 if not provided
}) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodType | 'all'>('all');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [aiFeedback, setAiFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEntries();
  }, [refreshKey]); // Reload entries when refreshKey changes

  useEffect(() => {
    // Load AI feedback for all entries when entries change
    if (entries.length > 0) {
      entries.forEach(entry => {
        if (!aiFeedback[entry.id]) {
          loadAIFeedback(entry.id, entry.content);
        }
      });
    }
  }, [entries]);

  const loadAIFeedback = async (entryId: string, content: string) => {
    try {
      const feedback = await journalService.generateAIFeedback(entryId, content);
      setAiFeedback(prev => ({ ...prev, [entryId]: feedback.feedback }));
    } catch (error) {
      console.error('Error loading AI feedback:', error);
      setAiFeedback(prev => ({ ...prev, [entryId]: "Thanks for sharing your thoughts. Taking time to reflect is valuable for your wellbeing." }));
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      // Get the current user ID from localStorage
      const storedUserData = localStorage.getItem('userData');
      if (!storedUserData) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your journal entries.",
          variant: "destructive"
        });
        return;
      }
      
      const userData = JSON.parse(storedUserData);
      console.log('Loading journal entries for user:', userData.userId);
      const userEntries = await journalService.getJournalEntries(userData.userId);
      console.log('Loaded journal entries:', userEntries);
      setEntries(userEntries || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({
          title: "Session Expired",
          description: "Please log in again to view your journal entries.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to load journal entries: ${error.message}`,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await journalService.deleteJournalEntry(entryId);
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      toast({
        title: "Entry Deleted",
        description: "Your journal entry has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete journal entry.",
        variant: "destructive"
      });
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
  };

  const handleEntryUpdated = (updatedEntry: JournalEntry) => {
    setEntries(prev => prev.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ));
    setEditingEntry(null);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const toggleExpanded = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
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

  const getMoodColor = (mood: MoodType): string => {
    switch (mood) {
      case 'great':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'okay':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'bad':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'awful':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  console.log('🔍 Debug entries:', entries);
  console.log('🔍 Debug entries length:', entries?.length);
  
  const filteredEntries = (entries || []).filter(entry => {
    console.log('🔍 Debug filtering entry:', entry);
    if (!entry || entry.title === undefined || entry.content === undefined) {
      console.log('🔍 Entry filtered out:', { hasTitle: entry?.title !== undefined, hasContent: entry?.content !== undefined });
      return false;
    }
    const title = entry.title || '';
    const content = entry.content || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = moodFilter === 'all' || entry.mood === moodFilter;
    return matchesSearch && matchesMood;
  });
  
  console.log('🔍 Debug filteredEntries length:', filteredEntries.length);

  const formatDate = (date: Date) => {
    const now = new Date();
    const entryDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return entryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Journal Entries
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Journal Entries
        </h2>
        {onCreateEntry && (
          <Button onClick={onCreateEntry} variant="therapeutic">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={moodFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMoodFilter('all')}
              >
                All
              </Button>
              {(['great', 'good', 'okay', 'bad', 'awful'] as MoodType[]).map((mood) => (
                <Button
                  key={mood}
                  variant={moodFilter === mood ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMoodFilter(mood)}
                  className="flex items-center gap-1"
                >
                  {getMoodIcon(mood)}
                  <span className="capitalize">{mood}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No entries found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || moodFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Start your journaling journey by creating your first entry.'}
            </p>
            {onCreateEntry && (
              <Button onClick={onCreateEntry} variant="therapeutic">
                <Plus className="h-4 w-4 mr-2" />
                Create First Entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Card 
              key={entry.id} 
              className="hover:shadow-therapeutic transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedEntry(entry)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{entry.title}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(entry.createdAt)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("flex items-center gap-1", getMoodColor(entry.mood))}
                      >
                        {getMoodIcon(entry.mood)}
                        <span className="capitalize">{entry.mood}</span>
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground/90 leading-relaxed">
                      {expandedEntries.has(entry.id) 
                        ? entry.content 
                        : entry.content.length > 200 
                          ? `${entry.content.substring(0, 200)}...` 
                          : entry.content
                      }
                    </p>
                  </div>
                  
                  {entry.content.length > 200 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(entry.id)}
                      className="text-primary"
                    >
                      {expandedEntries.has(entry.id) ? 'Show Less' : 'Read More'}
                    </Button>
                  )}

                  {/* AI Feedback - Generated by API */}
                  {aiFeedback[entry.id] && (
                    <AIFeedback 
                      feedback={{
                        id: `fb-${entry.id}`,
                        entryId: entry.id,
                        feedback: aiFeedback[entry.id],
                        createdAt: entry.createdAt
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <EditJournalEntry
              entry={editingEntry}
              onEntryUpdated={handleEntryUpdated}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {/* View Entry Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{selectedEntry.title}</CardTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedEntry.createdAt)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("flex items-center gap-1", getMoodColor(selectedEntry.mood))}
                    >
                      {getMoodIcon(selectedEntry.mood)}
                      <span className="capitalize">{selectedEntry.mood}</span>
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditingEntry(selectedEntry); setSelectedEntry(null); }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        handleDeleteEntry(selectedEntry.id);
                        setSelectedEntry(null);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {selectedEntry.content}
                </p>
              </div>
              
              {/* Achievements & AI Feedback */}
              <div className="mt-6 px-6">
                <h3 className="text-xl font-semibold mb-4">Achievements</h3>
                {aiFeedback[selectedEntry.id] ? (
                <div className="mt-6">
                  <AIFeedback 
                    feedback={{
                      id: `fb-${selectedEntry.id}`,
                      entryId: selectedEntry.id,
                      feedback: aiFeedback[selectedEntry.id],
                      createdAt: selectedEntry.createdAt
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No achievements yet. Keep journaling to unlock achievements!</p>
                </div>
              )}
              </div>
            </CardContent>

            <div className="border-t p-4 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedEntry(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JournalFeed;
