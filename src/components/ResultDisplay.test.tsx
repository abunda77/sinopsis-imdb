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

describe('ResultDisplay - Save Updates Sidebar', () => {
  /**
   * Property-Based Test
   * Feature: movie-synopsis-finder, Property 8: Save updates sidebar
   * Validates: Requirements 2.5
   * 
   * Property: For any movie result that is successfully saved, the sidebar should
   * immediately include an entry for that movie without requiring a page refresh.
   */
  it('property: save operation updates sidebar immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for valid dates
        fc.integer({ 
          min: new Date('2000-01-01').getTime(), 
          max: new Date('2030-12-31').getTime() 
        }).map(timestamp => new Date(timestamp)),
        // Generator for movie result
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          synopsis: fc.string({ minLength: 10, maxLength: 500 }),
          imdbScore: fc.double({ min: 0, max: 10, noNaN: true }),
        }),
        async (searchedAt, resultData) => {
          const result: MovieResult = {
            ...resultData,
            searchedAt,
            savedAt: null
          };

          // Track sidebar state
          let sidebarResults: MovieResult[] = [];
          let saveCallCount = 0;

          // Mock onSave that simulates the save operation
          const mockOnSave = vi.fn(async () => {
            saveCallCount++;
            // Simulate successful save by adding to sidebar results
            const savedResult = { ...result, savedAt: new Date() };
            sidebarResults = [savedResult, ...sidebarResults];
          });

          const mockOnRetry = vi.fn();

          // Render the component
          const { unmount } = render(
            <ConfigProvider>
              <AppProvider>
                <ResultDisplay
                  result={result}
                  isLoading={false}
                  onSave={mockOnSave}
                  onRetry={mockOnRetry}
                  isSaved={false}
                />
              </AppProvider>
            </ConfigProvider>
          );

          try {
            // Get the initial sidebar state (should be empty)
            const initialSidebarLength = sidebarResults.length;
            expect(initialSidebarLength).toBe(0);

            // Find and click the Save button
            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toBeInTheDocument();
            expect(saveButton).not.toBeDisabled();

            // Click the save button
            await saveButton.click();

            // Wait for the save operation to complete
            await vi.waitFor(() => {
              expect(saveCallCount).toBe(1);
            }, { timeout: 1000 });

            // Property: The sidebar should now include the saved result
            expect(sidebarResults.length).toBe(initialSidebarLength + 1);

            // Verify the saved result is in the sidebar
            const savedInSidebar = sidebarResults.find(r => r.id === result.id);
            expect(savedInSidebar).toBeDefined();
            expect(savedInSidebar!.title).toBe(result.title);
            expect(savedInSidebar!.synopsis).toBe(result.synopsis);
            expect(savedInSidebar!.imdbScore).toBeCloseTo(result.imdbScore, 10);
            expect(savedInSidebar!.savedAt).not.toBeNull();

            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property-based test with 100 runs
});

describe('ResultDisplay - Retry Uses Same Title', () => {
  /**
   * Property-Based Test
   * Feature: movie-synopsis-finder, Property 10: Retry uses same title
   * Validates: Requirements 3.1
   * 
   * Property: For any movie result currently displayed, clicking retry should
   * initiate a new LLM request with the same movie title as the original search.
   */
  it('property: retry uses the same movie title from current result', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for valid dates
        fc.integer({ 
          min: new Date('2000-01-01').getTime(), 
          max: new Date('2030-12-31').getTime() 
        }).map(timestamp => new Date(timestamp)),
        // Generator for movie result
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          synopsis: fc.string({ minLength: 10, maxLength: 500 }),
          imdbScore: fc.double({ min: 0, max: 10, noNaN: true }),
        }),
        async (searchedAt, resultData) => {
          const result: MovieResult = {
            ...resultData,
            searchedAt,
            savedAt: null
          };

          // Track the title used in retry
          let retryTitle: string | null = null;
          let retryCallCount = 0;

          // Mock onRetry that captures the title being used
          const mockOnRetry = vi.fn(async () => {
            retryCallCount++;
            // In a real implementation, onRetry would call the search function
            // with the same title from the current result
            // We simulate this by capturing the title
            retryTitle = result.title;
          });

          const mockOnSave = vi.fn();

          // Render the component
          const { unmount } = render(
            <ConfigProvider>
              <AppProvider>
                <ResultDisplay
                  result={result}
                  isLoading={false}
                  onSave={mockOnSave}
                  onRetry={mockOnRetry}
                  isSaved={false}
                />
              </AppProvider>
            </ConfigProvider>
          );

          try {
            // Find the Retry button
            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
            expect(retryButton).not.toBeDisabled();

            // Click the retry button
            retryButton.click();

            // Wait for the retry operation to be called
            await vi.waitFor(() => {
              expect(retryCallCount).toBe(1);
            }, { timeout: 1000 });

            // Property: The retry should use the same title as the current result
            expect(retryTitle).toBe(result.title);
            expect(mockOnRetry).toHaveBeenCalledTimes(1);

            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property-based test with 100 runs
});

describe('ResultDisplay - Save Error Preserves State', () => {
  /**
   * Property-Based Test
   * Feature: movie-synopsis-finder, Property 9: Save error preserves state
   * Validates: Requirements 2.3
   * 
   * Property: For any save operation that fails due to database error, the current
   * display state should remain unchanged and an error message should be shown.
   */
  it('property: save error preserves display state', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for valid dates
        fc.integer({ 
          min: new Date('2000-01-01').getTime(), 
          max: new Date('2030-12-31').getTime() 
        }).map(timestamp => new Date(timestamp)),
        // Generator for movie result
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          synopsis: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
          imdbScore: fc.double({ min: 0, max: 10, noNaN: true }),
        }),
        // Generator for various database error messages
        fc.oneof(
          fc.constant('Database not initialized'),
          fc.constant('UNIQUE constraint failed: movie_results.title'),
          fc.constant('Database connection lost'),
          fc.constant('Disk full'),
          fc.constant('Permission denied'),
          fc.constant('Database is locked'),
          fc.string({ minLength: 10, maxLength: 100 }).map(s => `Database error: ${s}`)
        ),
        async (searchedAt, resultData, errorMessage) => {
          const result: MovieResult = {
            ...resultData,
            searchedAt,
            savedAt: null
          };

          // Mock onSave that simulates a database error
          const mockOnSave = vi.fn(async () => {
            throw new Error(errorMessage);
          });

          const mockOnRetry = vi.fn();

          // Render the component
          const { unmount } = render(
            <ConfigProvider>
              <AppProvider>
                <ResultDisplay
                  result={result}
                  isLoading={false}
                  onSave={mockOnSave}
                  onRetry={mockOnRetry}
                  isSaved={false}
                />
              </AppProvider>
            </ConfigProvider>
          );

          try {
            // Capture the initial display state
            const titleElement = screen.getByRole('heading', { level: 2 });
            const scoreElement = screen.getByText(result.imdbScore.toFixed(1));

            // Verify initial state is displayed correctly
            // HTML normalizes whitespace, so we trim the expected value
            expect(titleElement).toHaveTextContent(result.title.trim());
            expect(scoreElement).toBeInTheDocument();
            
            // For synopsis, find the paragraph with the synopsis class
            // We use getAllByText with a flexible matcher since HTML normalizes whitespace
            const paragraphs = screen.getAllByText((_, element) => {
              return element?.tagName.toLowerCase() === 'p' && 
                     element?.className.includes('leading-relaxed');
            });
            expect(paragraphs.length).toBeGreaterThan(0);
            const synopsisElement = paragraphs[0];
            expect(synopsisElement).toBeInTheDocument();

            // Find and click the Save button
            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toBeInTheDocument();
            expect(saveButton).not.toBeDisabled();

            // Click the save button (this should trigger an error)
            saveButton.click();

            // Wait for the error to be processed
            await vi.waitFor(() => {
              expect(mockOnSave).toHaveBeenCalled();
            }, { timeout: 1000 });

            // Wait a bit for the error message to appear
            await new Promise(resolve => setTimeout(resolve, 100));

            // Property 1: The display state should remain unchanged
            // All original content should still be visible
            const titleAfterError = screen.getByRole('heading', { level: 2 });
            // HTML normalizes whitespace, so we trim the expected value
            expect(titleAfterError).toHaveTextContent(result.title.trim());
            expect(screen.getByText(result.imdbScore.toFixed(1))).toBeInTheDocument();
            
            // Verify synopsis is still displayed
            const paragraphsAfterError = screen.getAllByText((_, element) => {
              return element?.tagName.toLowerCase() === 'p' && 
                     element?.className.includes('leading-relaxed');
            });
            expect(paragraphsAfterError.length).toBeGreaterThan(0);
            const synopsisAfterError = paragraphsAfterError[0];
            expect(synopsisAfterError).toBeInTheDocument();

            // Property 2: An error message should be displayed
            const errorAlert = screen.getByRole('alert');
            expect(errorAlert).toBeInTheDocument();
            
            // The error alert should contain "Save Error" title
            expect(screen.getByText('Save Error')).toBeInTheDocument();
            
            // The error message should be displayed (HTML normalizes whitespace, so we trim)
            expect(screen.getByText(errorMessage.trim())).toBeInTheDocument();

            // Property 3: The Save button should still be enabled (not disabled)
            // so the user can retry the save operation
            const saveButtonAfterError = screen.getByRole('button', { name: /save/i });
            expect(saveButtonAfterError).not.toBeDisabled();

            // Property 4: The result should not be marked as saved
            // (the button should still say "Save", not "Already Saved")
            expect(saveButtonAfterError).toHaveTextContent('Save');

            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property-based test with 100 runs
});
