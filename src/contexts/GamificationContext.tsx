import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// 1. Define the shape of our data
export interface GamificationStatus {
  totalPoints: number;
  totalEntries: number;
  currentStreak: number;
  achievements: any[];
}

// 2. Define what our context will provide
interface GamificationContextType extends GamificationStatus {
  isLoading: boolean;
  error: string | null;
  refreshStatus: () => void;
}

// 3. Create the context
const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// 4. Create the Provider component
export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<GamificationStatus>({
    totalPoints: 0,
    totalEntries: 0,
    currentStreak: 0,
    achievements: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to memoize the fetch function
  const fetchStatus = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    console.log('Fetching gamification status...', { hasToken: !!token });
    
    if (!token) {
      console.log('No auth token found, skipping gamification fetch');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Add cache-busting query parameter
      const cacheBuster = new Date().getTime();
      const url = `http://localhost:3000/api/gamification/status?_=${cacheBuster}`;

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include',
        cache: 'no-store' as RequestCache // Ensure no caching
      });
      
      console.log('Gamification response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gamification API error:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Gamification data received:', data);
      
      // Ensure we have the expected structure
      const normalizedData = {
        totalPoints: data.totalPoints || 0,
        totalEntries: data.totalEntries || 0,
        currentStreak: data.currentStreak || 0,
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
      };
      
      console.log('Setting gamification status:', normalizedData);
      setStatus(normalizedData);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error("Failed to fetch gamification status:", error);
      setError(errorMessage);
      
      // Set default empty state on error to prevent UI issues
      setStatus({
        totalPoints: 0,
        totalEntries: 0,
        currentStreak: 0,
        achievements: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 5. Fetch data when the provider first loads
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const value = {
    ...status,
    isLoading,
    error,
    refreshStatus: fetchStatus,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

// 6. Create the custom hook to easily use the context
export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
