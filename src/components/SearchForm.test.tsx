import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { SearchForm } from './SearchForm';
import { AppProvider } from '../context/AppContext';
import { ConfigProvider } from '../context/ConfigContext';

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

// Mock fetch for LLM API calls
globalThis.fetch = vi.fn();

describe('SearchForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSearchForm = () => {
    return render(
      <ConfigProvider>
        <AppProvider>
          <SearchForm />
        </AppProvider>
      </ConfigProvider>
    );
  };

  it('renders input field and search button', () => {
    renderSearchForm();
    
    expect(screen.getByPlaceholderText('Enter movie title...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('validates empty input and shows error message', async () => {
    renderSearchForm();
    
    const submitButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Movie title cannot be empty')).toBeInTheDocument();
    });
  });

  it('validates whitespace-only input and shows error message', async () => {
    renderSearchForm();
    
    const input = screen.getByPlaceholderText('Enter movie title...');
    fireEvent.change(input, { target: { value: '   ' } });
    
    const submitButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Movie title cannot be empty')).toBeInTheDocument();
    });
  });

  it('shows loading state during search', async () => {
    // Mock a delayed response
    (globalThis.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '{"synopsis": "Test synopsis", "imdbScore": 8.5}'
            }
          }]
        })
      }), 100))
    );

    renderSearchForm();
    
    const input = screen.getByPlaceholderText('Enter movie title...');
    fireEvent.change(input, { target: { value: 'Inception' } });
    
    const submitButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(submitButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  it('calls LLM service with movie title on submit', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '{"synopsis": "A mind-bending thriller", "imdbScore": 8.8}'
          }
        }]
      })
    });

    renderSearchForm();
    
    const input = screen.getByPlaceholderText('Enter movie title...');
    const movieTitle = 'Inception';
    fireEvent.change(input, { target: { value: movieTitle } });
    
    const submitButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          }),
          body: expect.stringContaining(movieTitle)
        })
      );
    });
  });

  it('clears validation error when user starts typing', async () => {
    renderSearchForm();
    
    // First trigger validation error
    const submitButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Movie title cannot be empty')).toBeInTheDocument();
    });
    
    // Then start typing
    const input = screen.getByPlaceholderText('Enter movie title...');
    fireEvent.change(input, { target: { value: 'I' } });
    
    // Error should be cleared
    expect(screen.queryByText('Movie title cannot be empty')).not.toBeInTheDocument();
  });

  /**
   * Property-Based Test
   * Feature: movie-synopsis-finder, Property 4: Loading state visibility
   * Validates: Requirements 1.3, 3.3
   * 
   * Property: For any non-empty movie title, when a search operation is in progress,
   * the UI should display a loading indicator until the operation completes.
   */
  it('property: loading state is visible during any search operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random non-empty movie titles (alphanumeric with spaces)
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate random delay times (20-100ms to simulate API calls)
        fc.integer({ min: 20, max: 100 }),
        async (movieTitle, delayMs) => {
          // Mock a delayed LLM response
          (globalThis.fetch as any).mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({
              ok: true,
              json: async () => ({
                choices: [{
                  message: {
                    content: JSON.stringify({
                      synopsis: `Synopsis for ${movieTitle}`,
                      imdbScore: 7.5
                    })
                  }
                }]
              })
            }), delayMs))
          );

          const { unmount } = renderSearchForm();
          
          try {
            // Enter the movie title
            const input = screen.getByPlaceholderText('Enter movie title...');
            fireEvent.change(input, { target: { value: movieTitle } });
            
            // Submit the search
            const submitButton = screen.getByRole('button', { name: /search/i });
            fireEvent.click(submitButton);
            
            // Verify loading indicator appears
            // The button text should change to "Searching..." during loading
            await waitFor(() => {
              const loadingButton = screen.getByText('Searching...');
              expect(loadingButton).toBeInTheDocument();
            }, { timeout: 500 });
            
            // Wait for the operation to complete
            await waitFor(() => {
              const searchButton = screen.getByRole('button', { name: /search/i });
              expect(searchButton).toBeInTheDocument();
            }, { timeout: delayMs + 500 });
            
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
