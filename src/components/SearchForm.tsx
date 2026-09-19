import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { ValidationService } from '../services/validation';
import { LLMError } from '../services/llm';

/**
 * SearchForm component for movie title input and search submission
 * 
 * Requirements:
 * - 1.1: Send request to LLM with movie title
 * - 1.3: Display loading indicator during search
 * - 1.5: Validate that movie title is not empty
 * - 7.1: Use TailwindCSS for styling
 * - 7.2: Use shadcn/ui components
 */
export function SearchForm() {
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { setCurrentResult, setIsLoading, setError, isLoading } = useApp();
  const { llmService, isConfigured, configError } = useConfig();
  
  const validationService = new ValidationService();

  /**
   * Handle form submission
   * Validates input, calls LLM service, and updates app state
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationError(null);
    setError(null);

    // Validate movie title (Requirement 1.5)
    const validation = validationService.validateMovieTitle(title);
    if (!validation.isValid) {
      setValidationError(validation.errors[0]);
      return;
    }

    // Check if configuration is valid
    if (!isConfigured) {
      setError(configError || 'Application is not configured properly');
      return;
    }

    try {
      // Set loading state (Requirement 1.3)
      setIsLoading(true);
      setError(null);

      // Call LLM service to search for movie (Requirement 1.1)
      const movieInfo = await llmService.searchMovie(title);

      // Create movie result with current data
      // Generate a simple unique ID (timestamp + random)
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const result = {
        id,
        title: title.trim(),
        synopsis: movieInfo.synopsis,
        imdbScore: movieInfo.imdbScore,
        searchedAt: new Date(),
        savedAt: null,
      };

      // Update app state with the result
      setCurrentResult(result);
      
    } catch (error) {
      // Handle errors from LLM service (Requirement 1.4)
      if (error instanceof LLMError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while searching for the movie');
      }
      setCurrentResult(null);
    } finally {
      // Clear loading state
      setIsLoading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-2">
        <label htmlFor="movie-title" className="text-sm font-semibold text-ink">
          Judul film
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Input field for movie title (Requirements 7.1, 7.2) */}
          <div className="relative min-w-0 flex-1">
            <span
              className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-faint"
              aria-hidden="true"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <Input
              id="movie-title"
              type="text"
              placeholder="Masukkan judul filmâ€¦"
              value={title}
              onChange={handleInputChange}
              disabled={isLoading || !isConfigured}
              className="h-12 pl-11"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'movie-title-error' : undefined}
            />
          </div>

          {/* Submit button (Requirements 7.1, 7.2) */}
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || !isConfigured}
            aria-busy={isLoading}
            className="h-12 shrink-0 sm:min-w-32"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mencariâ€¦
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
                </svg>
                Cari
              </>
            )}
          </Button>
        </div>

        {/* Reserved helper/error slot â€” never collapses when empty (gate 39) */}
        <div className="min-h-[1lh]" aria-live="polite">
          {validationError && (
            <p id="movie-title-error" className="flex items-center gap-2 text-sm text-danger" role="alert">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 10-1.5 0v4a.75.75 0 001.5 0v-4zm-.75 7.25a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <span>{validationError}</span>
            </p>
          )}
          {!isConfigured && configError && (
            <p className="flex items-start gap-2 text-sm text-danger" role="alert">
              <svg className="mt-1 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 10-1.5 0v4a.75.75 0 001.5 0v-4zm-.75 7.25a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <span>{configError}</span>
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
