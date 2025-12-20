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
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-3">
        <div className="flex gap-3">
          {/* Input field for movie title (Requirements 7.1, 7.2) */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Masukkan judul film..."
              value={title}
              onChange={handleInputChange}
              disabled={isLoading || !isConfigured}
              className="pl-10 h-12 text-base shadow-sm"
              aria-label="Movie title"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "title-error" : undefined}
            />
          </div>
          
          {/* Submit button (Requirements 7.1, 7.2) */}
          <Button
            type="submit"
            disabled={isLoading || !isConfigured}
            className="min-w-32 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mencari...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Cari
              </>
            )}
          </Button>
        </div>
        
        {/* Validation error message */}
        {validationError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 p-3 rounded-lg" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span id="title-error">{validationError}</span>
          </div>
        )}
        
        {/* Configuration error message */}
        {!isConfigured && configError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 p-3 rounded-lg" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{configError}</span>
          </div>
        )}
      </div>
    </form>
  );
}
