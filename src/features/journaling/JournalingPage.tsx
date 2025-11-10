import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { 
  BookOpen, 
  PenTool, 
  BarChart3, 
  Settings,
  Plus,
  Calendar,
  TrendingUp,
  Heart
} from 'lucide-react';
import { JournalFeed, CreateJournalEntry } from './components';
import { journalService } from './services';
import { JournalEntry, JournalStats } from './types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import LeftSidebar from '@/components/LeftSidebar';

interface JournalingPageProps {
  className?: string;
}

export const JournalingPage: React.FC<JournalingPageProps> = ({ className }) => {
  console.log('JournalingPage rendering...');
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();
  
  console.log('JournalingPage state:', { activeTab, showCreateForm, stats, error });

  const handleEntryCreated = async (newEntry: JournalEntry) => {
    try {
      // First verify the entry was actually created by trying to fetch it
      const storedUserData = localStorage.getItem('userData');
      if (!storedUserData) {
        throw new Error('User not authenticated');
      }
      
      const userData = JSON.parse(storedUserData);
      const entries = await journalService.getJournalEntries(userData.userId);
      const entryExists = entries.some(entry => entry.id === newEntry.id);
      
      if (!entryExists) {
        throw new Error('Failed to verify journal entry creation');
      }
      
      // Only update UI if the entry was actually created
      setShowCreateForm(false);
      setActiveTab('feed');
      
      // Refresh stats and feed
      await loadStats();
      setRefreshKey(prev => prev + 1);
      
      toast({
        title: "Entry Created",
        description: "Your journal entry has been saved successfully.",
      });
    } catch (error) {
      console.error('Error verifying journal entry:', error);
      toast({
        title: "Error",
        description: "There was an issue saving your journal entry. Please try again.",
        variant: "destructive"
      });
      // Don't change the UI state if there was an error
      setShowCreateForm(true);
    }
  };

  const loadStats = async () => {
  try {
    // Get the current user ID from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (!storedUserData) {
      console.log('No user data found, skipping stats load');
      return;
    }
    
    const userData = JSON.parse(storedUserData);
    const entries = await journalService.getJournalEntries(userData.userId);
    
    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate streak
    let streak = 0;
    let lastDate: Date | null = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);
      
      if (!lastDate) {
        // First entry
        lastDate = entryDate;
        streak = 1;
        continue;
      }

      const diffTime = lastDate.getTime() - entryDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, skip
        continue;
      } else if (diffDays === 1) {
        // Consecutive day
        streak++;
        lastDate = entryDate;
      } else {
        // Gap found, streak ends
        break;
      }
    }

    // Check if the most recent entry was today or yesterday
    if (sortedEntries.length > 0) {
      const lastEntryDate = new Date(sortedEntries[0].createdAt);
      lastEntryDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastEntryDate.getTime() < yesterday.getTime()) {
        // Last entry was before yesterday, reset streak
        streak = 0;
      }
    }

    const totalEntries = entries.length;
    const moodValues = { great: 5, good: 4, okay: 3, bad: 2, awful: 1 };
    const averageMood = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + moodValues[entry.mood], 0) / entries.length 
      : 0;
    
    const moodDistribution = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalEntries,
      averageMood,
      moodDistribution: moodDistribution as any,
      streakDays: streak,
      lastEntryDate: sortedEntries[0]?.createdAt
    });
  } catch (error) {
    console.error('Failed to load stats:', error);
    setError('Failed to load journal stats');
  }
};

  React.useEffect(() => {
    loadStats();
  }, []);

  // Add error boundary to catch any rendering errors
  React.useEffect(() => {
    console.log('JournalingPage mounted');
    return () => {
      console.log('JournalingPage unmounted');
    };
  }, []);

  const getMoodEmoji = (mood: number) => {
    if (mood >= 4.5) return '😊';
    if (mood >= 3.5) return '🙂';
    if (mood >= 2.5) return '😐';
    if (mood >= 1.5) return '😔';
    return '😢';
  };

  const getMoodLabel = (mood: number) => {
    if (mood >= 4.5) return 'Great';
    if (mood >= 3.5) return 'Good';
    if (mood >= 2.5) return 'Okay';
    if (mood >= 1.5) return 'Bad';
    return 'Awful';
  };

  return (
    <div className="min-h-screen">
      <main className="w-full px-4 py-12">
        <div className={`transition-all duration-500 ease-in-out ${isSidebarOpen ? "grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-6" : "grid grid-cols-1 gap-6"}`}>
          {isSidebarOpen && (
            <div className="sticky top-3 self-start">
              <LeftSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
          )}
        <div className="w-full max-w-screen-xl mx-auto transition-all duration-500 ease-in-out">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Journal
          </h1>
          <p className="text-muted-foreground">
            Reflect on your thoughts, track your mood, and grow through mindful journaling.
          </p>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PenTool className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                    <p className="text-2xl font-bold">{stats.totalEntries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Heart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Mood</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      {getMoodEmoji(stats.averageMood)}
                      <span className="text-sm font-normal">{getMoodLabel(stats.averageMood)}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold">{stats.streakDays} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Entry</p>
                    <p className="text-sm font-bold">
                      {stats.lastEntryDate 
                        ? stats.lastEntryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'None'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Write
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <JournalFeed 
              onCreateEntry={() => setActiveTab('create')}
              key={refreshKey} // Force re-render when entries are created
            />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Create New Entry</h2>
              <Button
                variant="outline"
                onClick={() => setActiveTab('feed')}
              >
                View Feed
              </Button>
            </div>
            <CreateJournalEntry 
              onEntryCreated={handleEntryCreated}
              onCancel={() => setActiveTab('feed')}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Insights Coming Soon</h3>
              <p className="text-muted-foreground">
                Detailed analytics and insights about your journaling patterns will be available here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        </div>
        </div>
      </main>
    </div>
  );
};

export default JournalingPage;
