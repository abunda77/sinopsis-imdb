import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { MovieResult } from '../types/models';

/**
 * State interface for the App context
 */
interface AppState {
  /** Currently displayed movie result */
  currentResult: MovieResult | null;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message to display to user */
  error: string | null;
}

/**
 * Context value interface including state and state setters
 */
interface AppContextValue extends AppState {
  /** Set the current movie result */
  setCurrentResult: (result: MovieResult | null) => void;
  /** Set the loading state */
  setIsLoading: (loading: boolean) => void;
  /** Set the error message */
  setError: (error: string | null) => void;
  /** Clear all state (reset to initial) */
  clearState: () => void;
}

/**
 * Initial state for the App context
 */
const initialState: AppState = {
  currentResult: null,
  isLoading: false,
  error: null,
};

/**
 * App Context for managing current result, loading, and error state
 */
const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Props for AppProvider component
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider component that wraps the application and provides app state
 */
export function AppProvider({ children }: AppProviderProps) {
  const [currentResult, setCurrentResult] = useState<MovieResult | null>(initialState.currentResult);
  const [isLoading, setIsLoading] = useState<boolean>(initialState.isLoading);
  const [error, setError] = useState<string | null>(initialState.error);

  /**
   * Clear all state and reset to initial values
   */
  const clearState = () => {
    setCurrentResult(null);
    setIsLoading(false);
    setError(null);
  };

  const value: AppContextValue = {
    currentResult,
    isLoading,
    error,
    setCurrentResult,
    setIsLoading,
    setError,
    clearState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Custom hook to use the App context
 * @throws {Error} If used outside of AppProvider
 */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
