import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { MovieResult } from '../types/models';

/**
 * Props for ResultDisplay component
 */
interface ResultDisplayProps {
  /** Movie result to display */
  result: MovieResult | null;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Callback to save the current result */
  onSave: () => Promise<void>;
  /** Callback to retry the search */
  onRetry: () => Promise<void>;
  /** Whether the result is already saved */
  isSaved: boolean;
}

/**
 * ResultDisplay component displays movie information with save and retry actions
 * 
 * Requirements:
 * - 1.2: Display movie synopsis and IMDb score
 * - 1.4: Display error messages
 * - 2.1: Save button to store results
 * - 2.3: Handle save errors
 * - 2.4: Display confirmation message
 * - 3.1: Retry button to search again
 * - 3.2: Replace result on retry
 * - 3.3: Show loading state during retry
 * - 7.1: Use TailwindCSS for styling
 * - 7.2: Use shadcn/ui components
 */
export function ResultDisplay({
  result,
  isLoading,
  onSave,
  onRetry,
  isSaved,
}: ResultDisplayProps) {
  const { error } = useApp();
  const [saveLoading, setSaveLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Handle save button click
   */
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await onSave();
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save result';
      setSaveError(errorMessage);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveError(null);
      }, 5000);
    } finally {
      setSaveLoading(false);
    }
  };

  /**
   * Handle retry button click
   */
  const handleRetry = async () => {
    setRetryLoading(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      await onRetry();
    } catch (err) {
      // Error handling is done in parent component
    } finally {
      setRetryLoading(false);
    }
  };

  // Show loading state
  if (isLoading || retryLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {retryLoading ? 'Retrying search...' : 'Searching...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error if present
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show empty state if no result
  if (!result) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">
          Enter a movie title to search for information
        </p>
      </div>
    );
  }

  // Display movie result
  return (
    <div className="p-6 space-y-6">
      {/* Success message */}
      {saveSuccess && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Movie result saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Save error message */}
      {saveError && (
        <Alert variant="destructive">
          <AlertTitle>Save Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Movie information */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{result.title}</h2>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            IMDb Score
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">{result.imdbScore.toFixed(1)}</span>
            <span className="text-muted-foreground">/ 10</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Synopsis
          </h3>
          <p className="text-sm leading-relaxed">{result.synopsis}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaved || saveLoading}
          className="flex-1"
        >
          {saveLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
              Saving...
            </>
          ) : isSaved ? (
            'Already Saved'
          ) : (
            'Save'
          )}
        </Button>

        <Button
          onClick={handleRetry}
          variant="outline"
          disabled={retryLoading}
          className="flex-1"
        >
          {retryLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
              Retrying...
            </>
          ) : (
            'Retry'
          )}
        </Button>
      </div>
    </div>
  );
}
