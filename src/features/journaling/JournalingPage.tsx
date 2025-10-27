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
  
  console.log('JournalingPage state:', { activeTab, showCreateForm, stats, error });

  const handleEntryCreated = (newEntry: JournalEntry) => {
    setShowCreateForm(false);
    setActiveTab('feed');
    // Refresh stats if needed
    loadStats();
    // Force feed to reload by changing the key
    setRefreshKey(prev => prev + 1);
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
      
      const totalEntries = entries.length;
      const moodValues = { great: 5, good: 4, okay: 3, bad: 2, awful: 1 };
      const averageMood = entries.length > 0 
        ? entries.reduce((sum, entry) => sum + moodValues[entry.mood], 0) / entries.length 
        : 0;
      
      const moodDistribution = entries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate streak (simplified - in real app, this would be more sophisticated)
      const streakDays = entries.length > 0 ? Math.min(entries.length, 7) : 0;
      const lastEntryDate = entries.length > 0 ? entries[0].createdAt : undefined;

      setStats({
        totalEntries,
        averageMood,
        moodDistribution: moodDistribution as any,
        streakDays,
        lastEntryDate
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set error state but don't crash the page
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
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
  );
};

export default JournalingPage;
