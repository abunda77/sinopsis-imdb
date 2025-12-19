import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MovieResult } from '../types/models';
import { DatabaseService } from '../services/database';

/**
 * Context value interface for database operations and saved results
 */
interface DatabaseContextValue {
  /** Array of all saved movie results */
  savedResults: MovieResult[];
  /** Database service instance */
  databaseService: DatabaseService | null;
  /** Initialize the database */
  initializeDatabase: (dbPath?: string) => void;
  /** Save a movie result to the database */
  saveResult: (result: MovieResult) => Promise<void>;
  /** Load all results from the database */
  loadResults: () => void;
  /** Delete a result by ID */
  deleteResult: (id: string) => Promise<void>;
  /** Check if a result with the given title exists */
  resultExists: (title: string) => boolean;
  /** Get a result by ID */
  getResultById: (id: string) => MovieResult | null;
}

/**
 * Database Context for managing saved results and database operations
 */
const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined);

/**
 * Props for DatabaseProvider component
 */
interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * DatabaseProvider component that wraps the application and provides database functionality
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [savedResults, setSavedResults] = useState<MovieResult[]>([]);
  const [databaseService, setDatabaseService] = useState<DatabaseService | null>(null);

  /**
   * Initialize the database service
   */
  const initializeDatabase = useCallback((dbPath?: string) => {
    const service = new DatabaseService(dbPath);
    service.initialize();
    setDatabaseService(service);
    
    // Load initial results
    const results = service.getAllResults();
    setSavedResults(results);
  }, []);

  /**
   * Save a movie result to the database
   * @throws {Error} If database is not initialized or save fails
   */
  const saveResult = useCallback(async (result: MovieResult): Promise<void> => {
    if (!databaseService) {
      throw new Error('Database not initialized');
    }

    // Save to database (synchronous operation)
    databaseService.saveResult(result);

    // Update local state
    const updatedResults = databaseService.getAllResults();
    setSavedResults(updatedResults);
  }, [databaseService]);

  /**
   * Load all results from the database
   */
  const loadResults = useCallback(() => {
    if (!databaseService) {
      throw new Error('Database not initialized');
    }

    const results = databaseService.getAllResults();
    setSavedResults(results);
  }, [databaseService]);

  /**
   * Delete a result by ID
   * @throws {Error} If database is not initialized or delete fails
   */
  const deleteResult = useCallback(async (id: string): Promise<void> => {
    if (!databaseService) {
      throw new Error('Database not initialized');
    }

    // Delete from database (synchronous operation)
    databaseService.deleteResult(id);

    // Update local state
    const updatedResults = databaseService.getAllResults();
    setSavedResults(updatedResults);
  }, [databaseService]);

  /**
   * Check if a result with the given title exists
   */
  const resultExists = useCallback((title: string): boolean => {
    if (!databaseService) {
      return false;
    }
    return databaseService.resultExists(title);
  }, [databaseService]);

  /**
   * Get a result by ID
   */
  const getResultById = useCallback((id: string): MovieResult | null => {
    if (!databaseService) {
      return null;
    }
    return databaseService.getResultById(id);
  }, [databaseService]);

  const value: DatabaseContextValue = {
    savedResults,
    databaseService,
    initializeDatabase,
    saveResult,
    loadResults,
    deleteResult,
    resultExists,
    getResultById,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

/**
 * Custom hook to use the Database context
 * @throws {Error} If used outside of DatabaseProvider
 */
export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
