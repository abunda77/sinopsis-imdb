import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import { SearchForm } from './components/SearchForm';
import { ResultDisplay } from './components/ResultDisplay';
import { Sidebar } from './components/Sidebar';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * Main application content component
 * Handles the core application logic and layout
 * 
 * Requirements:
 * - 4.1: Load saved results from database on startup
 * - 6.3: Handle configuration errors
 * - 7.3: Responsive layout with sidebar and main content
 * - 7.4: Clear and organized layout
 * - 8.5: Organize code into reusable components
 */
function AppContent() {
  const { currentResult, setCurrentResult, setError } = useApp();
  const { 
    savedResults, 
    initializeDatabase, 
    saveResult, 
    deleteResult, 
    resultExists 
  } = useDatabase();
  const { configError, isConfigured, llmService } = useConfig();

  /**
   * Initialize database on component mount (Requirement 4.1)
   */
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize database';
        setError(errorMessage);
      }
    };
    init();
  }, [initializeDatabase, setError]);

  /**
   * Handle saving the current result to database
   */
  const handleSave = async () => {
    if (!currentResult) {
      throw new Error('No result to save');
    }

    // Create a new result with savedAt timestamp
    const resultToSave = {
      ...currentResult,
      savedAt: new Date(),
    };

    await saveResult(resultToSave);
  };

  /**
   * Handle retry - search for the same movie again
   */
  const handleRetry = async () => {
    if (!currentResult) {
      throw new Error('No result to retry');
    }

    // Use the LLM service to search again with the same title
    const movieInfo = await llmService.searchMovie(currentResult.title);

    // Create a new result with updated data
    const newResult = {
      id: crypto.randomUUID(),
      title: currentResult.title,
      synopsis: movieInfo.synopsis,
      imdbScore: movieInfo.imdbScore,
      searchedAt: new Date(),
      savedAt: null,
    };

    setCurrentResult(newResult);
  };

  /**
   * Handle selecting a result from the sidebar
   */
  const handleSelectResult = (result: typeof savedResults[0]) => {
    setCurrentResult(result);
    setError(null);
  };

  /**
   * Handle deleting a result
   */
  const handleDeleteResult = async (id: string) => {
    await deleteResult(id);
    
    // If the deleted result is currently displayed, clear it
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
  };

  /**
   * Check if current result is already saved
   */
  const [isCurrentResultSaved, setIsCurrentResultSaved] = useState(false);
  
  useEffect(() => {
    const checkSaved = async () => {
      if (currentResult) {
        const exists = await resultExists(currentResult.title);
        setIsCurrentResultSaved(exists);
      } else {
        setIsCurrentResultSaved(false);
      }
    };
    checkSaved();
  }, [currentResult, resultExists]);

  // Display configuration error if present (Requirement 6.3)
  if (configError && !isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              {configError}
              <br />
              <br />
              Please check your environment variables and ensure MODEL_NAME is set correctly.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Main application layout (Requirements 7.3, 7.4)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Movie Synopsis Finder
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cari informasi film menggunakan AI
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with responsive grid layout */}
      <div className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:gap-6 h-[calc(100vh-180px)]">
          {/* Sidebar - shows on left on desktop, top on mobile */}
          <aside className="lg:h-full overflow-hidden rounded-xl border bg-white/80 backdrop-blur-sm shadow-lg">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Riwayat Pencarian
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {savedResults.length} film tersimpan
              </p>
            </div>
            <div className="h-[calc(100%-73px)]">
              <Sidebar
                results={savedResults}
                onSelect={handleSelectResult}
                onDelete={handleDeleteResult}
                selectedId={currentResult?.id || null}
              />
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:h-full overflow-hidden rounded-xl border bg-white/80 backdrop-blur-sm shadow-lg flex flex-col">
            {/* Search form */}
            <div className="p-6 lg:p-8 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <SearchForm />
            </div>

            {/* Result display */}
            <div className="flex-1 overflow-y-auto">
              <ResultDisplay
                result={currentResult}
                isLoading={false}
                onSave={handleSave}
                onRetry={handleRetry}
                isSaved={isCurrentResultSaved}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Main App component with context providers and error boundary
 * 
 * Requirements:
 * - 8.5: Setup context providers for state management
 * - 1.4, 2.3, 5.3: Error boundary for catching React errors
 */
function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <DatabaseProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </DatabaseProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
