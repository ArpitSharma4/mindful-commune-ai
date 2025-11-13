import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, BarChart, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MoodTrendData {
  date: string;
  avg_mood_score: number;
  daily_entries: number;
}

interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
}

interface KeywordData {
  word: string;
  count: number;
}

interface InsightData {
  moodTrend: MoodTrendData[];
  sentimentDistribution: SentimentDistribution;
  correlatedKeywords: {
    great: KeywordData[];
    bad: KeywordData[];
    awful: KeywordData[];
  };
}

const COLORS = ['#10B981', '#6B7280', '#EF4444']; // Green, Gray, Red

const InsightsTab = () => {
  const [data, setData] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:3000/api/journal/insights`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} - Failed to fetch insights data`);
        }
        
        const insightsData: InsightData = await response.json();
        setData(insightsData);
      } catch (error) {
        console.error('Error fetching insights:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load insights',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [toast]);

  const renderMoodTrendChart = () => {
    if (!data?.moodTrend?.length) {
      return <p className="text-muted-foreground text-center py-8">No mood data available yet.</p>;
    }

    return (
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data.moodTrend}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#A0AEC0' }}
              tickLine={{ stroke: '#4A5568' }}
            />
            <YAxis 
              domain={[0, 5]}
              tick={{ fill: '#A0AEC0' }}
              tickLine={{ stroke: '#4A5568' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#2D3748',
                borderColor: '#4A5568',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avg_mood_score"
              name="Average Mood"
              stroke="#4299E1"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderSentimentChart = () => {
    if (!data) return null;
    
    const { positive, negative, neutral } = data.sentimentDistribution;
    const total = positive + negative + neutral;

    if (total === 0) {
      return <p className="text-muted-foreground text-center py-8">No sentiment data available yet.</p>;
    }

    const chartData = [
      { name: 'Positive', value: positive, color: '#10B981' },
      { name: 'Neutral', value: neutral, color: '#6B7280' },
      { name: 'Negative', value: negative, color: '#EF4444' },
    ];

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => 
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} entries`, 'Count']}
              contentStyle={{ 
                backgroundColor: '#2D3748',
                borderColor: '#4A5568',
                borderRadius: '0.5rem'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderKeywordCorrelation = () => {
    if (!data) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" /> 
            Top Correlated Keywords
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            The words you use most often when feeling strong emotions.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { mood: 'great', title: 'Top Words when Feeling Great', bg: 'bg-green-600/20', text: 'text-green-400' },
            { mood: 'awful', title: 'Top Words when Feeling Awful', bg: 'bg-red-600/20', text: 'text-red-400' }
          ].map(({ mood, title, bg, text }) => (
            <div key={mood} className={`p-4 rounded-lg ${bg}`}>
              <h3 className={`font-semibold text-lg ${text}`}>{title}</h3>
              <ul className="mt-2 space-y-1">
                {data.correlatedKeywords[mood as 'great' | 'awful']?.length > 0 ? (
                  data.correlatedKeywords[mood as 'great' | 'awful'].map((item, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{item.word}</span>
                      <span className="text-muted-foreground ml-2">({item.count})</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground/80 text-sm">No data available</li>
                )}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-muted-foreground">Loading insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Mood Trend (Last 90 Days)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your mood changes over time
          </p>
        </CardHeader>
        <CardContent>
          {renderMoodTrendChart()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-purple-400" />
            Sentiment Distribution
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Breakdown of your journal entries by sentiment
          </p>
        </CardHeader>
        <CardContent>
          {renderSentimentChart()}
        </CardContent>
      </Card>

      {renderKeywordCorrelation()}
    </div>
  );
};

export default InsightsTab;
