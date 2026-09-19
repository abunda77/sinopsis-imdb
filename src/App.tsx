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

    // If the deleted result is displayed, clear it
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
      <div className="grid min-h-dvh place-items-center bg-canvas p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              {configError}
              <br />
              <br />
              check your environment variables and ensure MODEL_NAME is set correctly.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Main application layout (Requirements 7.3, 7.4)
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      {/* Header — edge-aligned minimal (N9): wordmark left, status right */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="flex min-w-0 items-center gap-3">
            <span className="app-mark" aria-hidden="true">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 6v12M16 6v12M3 12h18" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="app-wordmark truncate">Movie Synopsis Finder</p>
              <p className="mono-label mt-1 text-faint">AI synopsis · IMDb score</p>
            </div>
          </div>

          <div className="app-status">
            <span className="status-dot" data-state={isConfigured ? 'ok' : 'down'} aria-hidden="true" />
            <span className="mono-label">{isConfigured ? 'Siap' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {/* Work area */}
      <div className="app-body">
        <div className="app-grid">
          {/* History rail */}
          <aside className="rail" aria-label="Riwayat pencarian">
            <div className="rail__head">
              <h2 className="rail__title">Riwayat</h2>
              <p className="mono-label text-faint">{savedResults.length} film tersimpan</p>
            </div>
            <Sidebar
              results={savedResults}
              onSelect={handleSelectResult}
              onDelete={handleDeleteResult}
              selectedId={currentResult?.id || null}
            />
          </aside>

          {/* Main panel */}
          <main className="panel">
            <div className="panel__search">
              <SearchForm />
            </div>
            <ResultDisplay
              result={currentResult}
              isLoading={false}
              onSave={handleSave}
              onRetry={handleRetry}
              isSaved={isCurrentResultSaved}
            />
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
