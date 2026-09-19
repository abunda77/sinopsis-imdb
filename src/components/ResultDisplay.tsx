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
    } catch {
      // Error handling is done in parent component
    } finally {
      setRetryLoading(false);
    }
  };

  // Show loading state
  if (isLoading || retryLoading) {
    return (
      <div className="grid min-h-[18rem] place-items-center p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="spinner" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink">
            {retryLoading ? 'Mencoba lagiâ€¦' : 'Mencari informasi filmâ€¦'}
          </p>
          <p className="text-xs text-faint">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  // Show error if present
  if (error) {
    return (
      <div className="p-6">
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
      <div className="grid min-h-[18rem] place-items-center p-8">
        <div className="max-w-sm text-center">
          <span className="empty-mark" aria-hidden="true">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 6v12M16 6v12M3 12h18" />
            </svg>
          </span>
          <h3 className="mt-4 text-base font-bold text-ink">Belum ada hasil pencarian</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Masukkan judul film di atas untuk mencari informasi dan sinopsisnya.
          </p>
        </div>
      </div>
    );
  }

  // Display movie result
  return (
    <div className="reveal space-y-6 p-6 lg:p-8">
      {/* Success message */}
      {saveSuccess && (
        <Alert className="border-success-line bg-success-soft text-success">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
            </svg>
            <AlertTitle className="mb-0">Berhasil disimpan</AlertTitle>
          </div>
          <AlertDescription className="mt-1">
            Film ini tersimpan di riwayat pencarian.
          </AlertDescription>
        </Alert>
      )}

      {/* Save error message */}
      {saveError && (
        <Alert variant="destructive">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 10-1.5 0v4a.75.75 0 001.5 0v-4zm-.75 7.25a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            <AlertTitle className="mb-0">Gagal menyimpan</AlertTitle>
          </div>
          <AlertDescription className="mt-1">{saveError}</AlertDescription>
        </Alert>
      )}

      <article className="space-y-5">
        <header className="space-y-3">
          <h2 className="display-wrap text-2xl font-bold tracking-tight text-ink lg:text-3xl">
            {result.title}
          </h2>

          <div className="score-strip">
            <span className="mono-label text-warn-ink">Skor IMDb</span>
            <p className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tabular-nums text-ink">
                {result.imdbScore.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/ 10</span>
            </p>
          </div>
        </header>

        <section className="space-y-2">
          <h3 className="mono-label">Sinopsis</h3>
          <p className="max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-2">
            {result.synopsis}
          </p>
        </section>
      </article>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 border-t border-rule pt-5 sm:flex-row">
        <Button
          onClick={handleSave}
          disabled={isSaved || saveLoading}
          aria-busy={saveLoading}
          className="h-12 w-full sm:flex-1"
        >
          {saveLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpanâ€¦
            </>
          ) : isSaved ? (
            <>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" />
              </svg>
              Sudah tersimpan
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h11l3 3v13H5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v5h6M8 20v-6h8v6" />
              </svg>
              Simpan
            </>
          )}
        </Button>

        <Button
          onClick={handleRetry}
          variant="outline"
          disabled={retryLoading}
          aria-busy={retryLoading}
          className="h-12 w-full sm:flex-1"
        >
          {retryLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mencoba lagiâ€¦
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" />
              </svg>
              Coba lagi
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
