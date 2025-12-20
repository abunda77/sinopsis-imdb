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
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
          <p className="mt-6 text-base font-medium text-foreground">
            {retryLoading ? 'Mencoba lagi...' : 'Mencari informasi film...'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Mohon tunggu sebentar
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
      <div className="flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Belum ada hasil pencarian</h3>
          <p className="text-muted-foreground">
            Masukkan judul film di atas untuk mencari informasi dan sinopsis
          </p>
        </div>
      </div>
    );
  }

  // Display movie result
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Success message */}
      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <AlertTitle className="text-green-800 mb-0">Berhasil!</AlertTitle>
          </div>
          <AlertDescription className="text-green-700 mt-2">
            Film berhasil disimpan ke riwayat pencarian
          </AlertDescription>
        </Alert>
      )}

      {/* Save error message */}
      {saveError && (
        <Alert variant="destructive">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <AlertTitle className="mb-0">Gagal Menyimpan</AlertTitle>
          </div>
          <AlertDescription className="mt-2">{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Movie information */}
      <div className="space-y-6">
        {/* Title */}
        <div className="border-b pb-4">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {result.title}
          </h2>
        </div>

        {/* IMDb Score */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h3 className="text-sm font-semibold text-yellow-900 uppercase tracking-wide">
              Skor IMDb
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-yellow-900">{result.imdbScore.toFixed(1)}</span>
            <span className="text-2xl text-yellow-700 font-medium">/ 10</span>
          </div>
        </div>

        {/* Synopsis */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
              Sinopsis
            </h3>
          </div>
          <p className="text-base leading-relaxed text-gray-700">{result.synopsis}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaved || saveLoading}
          className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
        >
          {saveLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Menyimpan...
            </>
          ) : isSaved ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Sudah Tersimpan
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Simpan
            </>
          )}
        </Button>

        <Button
          onClick={handleRetry}
          variant="outline"
          disabled={retryLoading}
          className="flex-1 h-12 text-base font-semibold shadow-sm hover:shadow-md transition-all"
        >
          {retryLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Mencoba Lagi...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Coba Lagi
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
