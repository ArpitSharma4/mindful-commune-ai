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
    if (!token) {
      setIsLoading(false);
      return; // Don't fetch if not logged in
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/gamification/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch gamification status:", error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
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
