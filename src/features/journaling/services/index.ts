// Journal services for API communication
import { JournalEntry, MoodType, AIFeedback, JournalPrompt, CreateJournalEntryRequest, JournalStats } from '../types';
import { apiRequest } from '@/lib/apiClient';

// Mock journal entries data
let mockJournalEntries: JournalEntry[] = [
  {
    id: '1',
    title: 'A Challenging Day',
    content: 'Today was really tough. I had a lot of pressure at work and felt overwhelmed by all the deadlines. It was hard to focus and I felt like I was falling behind.',
    mood: 'bad',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    userId: 'user1'
  },
  {
    id: '2',
    title: 'Small Victory',
    content: 'I finally finished that project I\'ve been working on for weeks! It feels so good to have it done. I\'m proud of myself for pushing through even when it was difficult.',
    mood: 'great',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    userId: 'user1'
  },
  {
    id: '3',
    title: 'Grateful Moment',
    content: 'Had a wonderful conversation with my friend today. We talked about our dreams and goals, and it reminded me how lucky I am to have such supportive people in my life.',
    mood: 'good',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
    userId: 'user1'
  }
];

// Mock AI feedback data
let mockAIFeedback: AIFeedback[] = [
  {
    id: 'fb1',
    entryId: '1',
    feedback: 'It sounds like you had a really challenging day and felt a lot of pressure. It\'s completely understandable to feel overwhelmed in situations like that. Remember that it\'s okay to take breaks and ask for help when you need it.',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'fb2',
    entryId: '2',
    feedback: 'Congratulations on completing your project! It\'s wonderful that you\'re recognizing your own perseverance and hard work. Celebrating these achievements, big or small, is so important for your wellbeing.',
    createdAt: new Date('2024-01-14')
  }
];

// Journal prompts
export const journalPrompts: JournalPrompt[] = [
  {
    id: '1',
    text: 'What is one thing you are grateful for today?',
    category: 'gratitude'
  },
  {
    id: '2',
    text: 'Describe a small victory you had this week.',
    category: 'celebration'
  },
  {
    id: '3',
    text: 'What is something that\'s been on your mind lately?',
    category: 'reflection'
  },
  {
    id: '4',
    text: 'How did you grow or learn something new today?',
    category: 'growth'
  },
  {
    id: '5',
    text: 'What challenge did you face today and how did you handle it?',
    category: 'challenge'
  },
  {
    id: '6',
    text: 'What made you smile or laugh today?',
    category: 'celebration'
  },
  {
    id: '7',
    text: 'What would you like to let go of from today?',
    category: 'reflection'
  },
  {
    id: '8',
    text: 'How did you take care of yourself today?',
    category: 'growth'
  }
];

// Mood options
export const moodOptions = [
  { value: 'great' as MoodType, label: 'Great', emoji: '😊', color: 'text-green-600' },
  { value: 'good' as MoodType, label: 'Good', emoji: '🙂', color: 'text-blue-600' },
  { value: 'okay' as MoodType, label: 'Okay', emoji: '😐', color: 'text-yellow-600' },
  { value: 'bad' as MoodType, label: 'Bad', emoji: '😔', color: 'text-orange-600' },
  { value: 'awful' as MoodType, label: 'Awful', emoji: '😢', color: 'text-red-600' }
];

// Helper function to transform backend response to frontend format
const transformJournalEntry = (backendEntry: any): JournalEntry => ({
  id: backendEntry.entry_id,
  title: backendEntry.title,
  content: backendEntry.content,
  mood: backendEntry.mood,
  createdAt: new Date(backendEntry.created_at),
  updatedAt: new Date(backendEntry.updated_at || backendEntry.created_at),
  userId: backendEntry.author_id
});

// API functions
export const journalService = {
  // Get all journal entries for a user
  getJournalEntries: async (userId: string): Promise<JournalEntry[]> => {
    const response = await apiRequest<any[]>('/api/journal');
    if (!response || !Array.isArray(response)) {
      console.error('Invalid response from API:', response);
      return [];
    }
    return response.map(transformJournalEntry);
  },

  // Create a new journal entry
  createJournalEntry: async (entry: CreateJournalEntryRequest, userId: string): Promise<JournalEntry> => {
    const response = await apiRequest<any>('/api/journal', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
    return transformJournalEntry(response);
  },

  // Update an existing journal entry
  updateJournalEntry: async (id: string, updates: Partial<CreateJournalEntryRequest>): Promise<JournalEntry> => {
    const response = await apiRequest<any>(`/api/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return transformJournalEntry(response);
  },

  // Delete a journal entry
  deleteJournalEntry: async (id: string): Promise<void> => {
    await apiRequest(`/api/journal/${id}`, {
      method: 'DELETE'
    });
  },

  // Get AI feedback for an entry
  getAIFeedback: async (entryId: string): Promise<AIFeedback | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockAIFeedback.find(feedback => feedback.entryId === entryId) || null;
  },

  // Generate AI feedback for an entry
  generateAIFeedback: async (entryId: string, content: string): Promise<AIFeedback> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing time
    
    // Mock AI feedback generation
    const feedbackTexts = [
      "It sounds like you're processing some important thoughts and feelings. Taking time to reflect like this is a valuable practice for your wellbeing.",
      "Thank you for sharing your thoughts with such honesty. It takes courage to be vulnerable with yourself, and that's something to be proud of.",
      "Your reflection shows a lot of self-awareness. Remember that it's okay to have difficult days - they're part of being human.",
      "I can hear the care you're taking with your thoughts and feelings. This kind of mindful reflection is a gift you're giving yourself.",
      "It's clear that you're thinking deeply about your experiences. This kind of introspection is an important part of personal growth."
    ];
    
    const randomFeedback = feedbackTexts[Math.floor(Math.random() * feedbackTexts.length)];
    
    const newFeedback: AIFeedback = {
      id: Date.now().toString(),
      entryId,
      feedback: randomFeedback,
      createdAt: new Date()
    };
    
    // Remove existing feedback for this entry
    mockAIFeedback = mockAIFeedback.filter(fb => fb.entryId !== entryId);
    mockAIFeedback.push(newFeedback);
    
    return newFeedback;
  },

  // Get journal statistics
  getJournalStats: async (userId: string): Promise<JournalStats> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userEntries = mockJournalEntries.filter(entry => entry.userId === userId);
    const moodValues = { great: 5, good: 4, okay: 3, bad: 2, awful: 1 };
    
    const moodDistribution = userEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<MoodType, number>);
    
    const averageMood = userEntries.length > 0 
      ? userEntries.reduce((sum, entry) => sum + moodValues[entry.mood], 0) / userEntries.length
      : 0;
    
    return {
      totalEntries: userEntries.length,
      averageMood,
      moodDistribution,
      streakDays: 0, // Would calculate actual streak in real implementation
      lastEntryDate: userEntries.length > 0 ? userEntries[0].createdAt : undefined
    };
  },

  // Get a random journal prompt
  getRandomPrompt: async (): Promise<JournalPrompt> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
  }
};
