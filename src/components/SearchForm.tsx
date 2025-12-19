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
      const result = {
        id: crypto.randomUUID(),
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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* Input field for movie title (Requirements 7.1, 7.2) */}
          <Input
            type="text"
            placeholder="Enter movie title..."
            value={title}
            onChange={handleInputChange}
            disabled={isLoading || !isConfigured}
            className="flex-1"
            aria-label="Movie title"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? "title-error" : undefined}
          />
          
          {/* Submit button (Requirements 7.1, 7.2) */}
          <Button
            type="submit"
            disabled={isLoading || !isConfigured}
            className="min-w-24"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        {/* Validation error message */}
        {validationError && (
          <p id="title-error" className="text-sm text-destructive" role="alert">
            {validationError}
          </p>
        )}
        
        {/* Configuration error message */}
        {!isConfigured && configError && (
          <p className="text-sm text-destructive" role="alert">
            {configError}
          </p>
        )}
      </div>
    </form>
  );
}
