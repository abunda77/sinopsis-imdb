import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import * as fc from 'fast-check';
import { ResultDisplay } from './ResultDisplay';
import { AppProvider, useApp } from '../context/AppContext';
import { ConfigProvider } from '../context/ConfigContext';
import type { MovieResult } from '../types/models';

// Mock the config module
vi.mock('../lib/config', () => ({
  tryLoadConfig: vi.fn(() => ({
    config: {
      apiKey: 'test-api-key',
      modelName: 'test-model',
      apiBaseUrl: 'https://api.test.com/v1'
    },
    error: null
  }))
}));

/**
 * Helper component to inject error into AppContext
 */
function ErrorInjector({ errorMessage, children }: { errorMessage: string; children: React.ReactNode }) {
  const { setError } = useApp();
  
  useEffect(() => {
    setError(errorMessage);
  }, [errorMessage, setError]);

  return <>{children}</>;
}

describe('ResultDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResult: MovieResult = {
    id: '123',
    title: 'Test Movie',
    synopsis: 'A test movie synopsis',
    imdbScore: 7.5,
    searchedAt: new Date(),
    savedAt: null
  };

  const mockOnSave = vi.fn();
  const mockOnRetry = vi.fn();

  /**
   * Property-Based Test
   * Feature: movie-synopsis-finder, Property 5: Error display on LLM failure
   * Validates: Requirements 1.4
   * 
   * Property: For any LLM request that fails (network error, invalid response, timeout),
   * an error message should be displayed to the user.
   */
  it('property: error message is displayed for any LLM failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various error messages that could come from LLM failures
        fc.oneof(
          // Network errors
          fc.constant('Network error: Failed to fetch'),
          fc.constant('Network error: Connection timeout'),
          fc.constant('Network error: Unable to reach server'),
          // API errors
          fc.constant('API Error: Rate limit exceeded'),
          fc.constant('API Error: Invalid request'),
          fc.constant('API Error: Server error (500)'),
          // Authentication errors
          fc.constant('Authentication failed: Invalid API key'),
          fc.constant('Authentication failed: Invalid credentials'),
          // Parsing errors
          fc.constant('Failed to parse LLM response'),
          fc.constant('Invalid response format from LLM'),
          fc.constant('Missing required fields in response'),
          // Timeout errors
          fc.constant('Request timeout'),
          fc.constant('Operation timed out'),
          // Generic errors
          fc.string({ minLength: 10, maxLength: 100 }).map(s => `Error: ${s}`)
        ),
        async (errorMessage) => {
          // Render with error injected through context
          const { unmount } = render(
            <ConfigProvider>
              <AppProvider>
                <ErrorInjector errorMessage={errorMessage}>
                  <ResultDisplay
                    result={mockResult}
                    isLoading={false}
                    onSave={mockOnSave}
                    onRetry={mockOnRetry}
                    isSaved={false}
                  />
                </ErrorInjector>
              </AppProvider>
            </ConfigProvider>
          );

          try {
            // Property: An error message should be displayed
            // The ResultDisplay component should show an Alert with the error
            const errorAlert = screen.getByRole('alert');
            expect(errorAlert).toBeInTheDocument();

            // The error message should contain the actual error text
            expect(screen.getByText(errorMessage)).toBeInTheDocument();

            // The error should be displayed in a destructive/error variant
            // (checking for "Error" title which is shown in the Alert)
            expect(screen.getByText('Error')).toBeInTheDocument();

            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // 30 second timeout for property-based test with 100 runs
});
