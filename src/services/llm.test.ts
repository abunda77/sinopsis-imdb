import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { LLMService } from './llm';
import type { LLMRequest } from '../types/api';

describe('LLMService', () => {
  let llmService: LLMService;

  beforeEach(() => {
    llmService = new LLMService();
    llmService.configure('test-api-key', 'gpt-4', 'https://api.test.com/v1');
  });

  /**
   * Feature: movie-synopsis-finder, Property 1: Search request contains movie title
   * Validates: Requirements 1.1
   * 
   * Property: For any non-empty movie title, when a user submits a search,
   * the LLM request should contain that exact movie title in the prompt.
   */
  describe('Property 1: Search request contains movie title', () => {
    it('should include the exact movie title in the LLM request for any non-empty title', async () => {
      // Generator for non-empty, non-whitespace strings (valid movie titles)
      const validMovieTitle = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

      await fc.assert(
        fc.asyncProperty(validMovieTitle, async (title) => {
          // Mock fetch to capture the request
          let capturedRequest: any = null;
          
          globalThis.fetch = vi.fn(async (_url, options) => {
            if (options?.body) {
              capturedRequest = JSON.parse(options.body as string) as LLMRequest;
            }
            
            // Return a valid mock response
            return {
              ok: true,
              status: 200,
              json: async () => ({
                choices: [{
                  message: {
                    content: JSON.stringify({
                      synopsis: 'Test synopsis',
                      imdbScore: 7.5
                    })
                  }
                }]
              })
            } as Response;
          });

          try {
            // Execute the search
            await llmService.searchMovie(title);

            // Property: The request should contain the exact movie title
            // Check that the request was captured
            expect(capturedRequest).not.toBeNull();
            
            if (capturedRequest !== null) {
              // Check that the title appears in the user message
              const userMessage = capturedRequest.messages.find((m: { role: string; content: string }) => m.role === 'user');
              expect(userMessage).toBeDefined();
              expect(userMessage?.content).toBe(title);
            }

            return true;
          } catch (_error) {
            // If there's an error, the property still holds if the request was made correctly
            // before the error occurred
            const request = capturedRequest;
            if (request !== null) {
              const userMessage = request.messages.find((m: { role: string; content: string }) => m.role === 'user');
              return userMessage?.content === title;
            }
            return false;
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: movie-synopsis-finder, Property 20: LLM requests use configured values
   * Validates: Requirements 6.4
   * 
   * Property: For any LLM request made by the application, the request should use
   * the API key and model name from the application configuration.
   */
  describe('Property 20: LLM requests use configured values', () => {
    it('should use configured API key, model name, and base URL for any search request', async () => {
      // Generators for configuration values
      const apiKeyGen = fc.string({ minLength: 10, maxLength: 50 });
      const modelNameGen = fc.constantFrom('gpt-4', 'gpt-3.5-turbo', 'claude-2', 'llama-2');
      const baseUrlGen = fc.constantFrom(
        'https://api.openai.com/v1',
        'https://api.anthropic.com/v1',
        'https://api.custom.com/v1'
      );
      const movieTitleGen = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

      await fc.assert(
        fc.asyncProperty(
          apiKeyGen,
          modelNameGen,
          baseUrlGen,
          movieTitleGen,
          async (apiKey, modelName, baseUrl, movieTitle) => {
            // Create a new service instance and configure it
            const service = new LLMService();
            service.configure(apiKey, modelName, baseUrl);

            // Capture the request details
            let capturedUrl: string | null = null;
            let capturedHeaders: Record<string, string> | null = null;
            let capturedRequest: any = null;

            globalThis.fetch = vi.fn(async (url, options) => {
              capturedUrl = url as string;
              capturedHeaders = options?.headers as Record<string, string>;
              if (options?.body) {
                capturedRequest = JSON.parse(options.body as string) as LLMRequest;
              }

              // Return a valid mock response
              return {
                ok: true,
                status: 200,
                json: async () => ({
                  choices: [{
                    message: {
                      content: JSON.stringify({
                        synopsis: 'Test synopsis',
                        imdbScore: 7.5
                      })
                    }
                  }]
                })
              } as Response;
            });

            try {
              // Execute the search
              await service.searchMovie(movieTitle);

              // Property 1: The request URL should use the configured base URL
              expect(capturedUrl).toBe(`${baseUrl}/chat/completions`);

              // Property 2: The request should include the configured API key in Authorization header
              expect(capturedHeaders).not.toBeNull();
              if (capturedHeaders !== null) {
                expect(capturedHeaders['Authorization']).toBe(`Bearer ${apiKey}`);
              }

              // Property 3: The request should use the configured model name
              expect(capturedRequest).not.toBeNull();
              if (capturedRequest !== null) {
                expect(capturedRequest.model).toBe(modelName);
              }

              return true;
            } catch (_error) {
              // If there's an error, check if the configuration was used correctly
              // before the error occurred
              if (capturedUrl && capturedHeaders && capturedRequest !== null) {
                return (
                  capturedUrl === `${baseUrl}/chat/completions` &&
                  capturedHeaders['Authorization'] === `Bearer ${apiKey}` &&
                  capturedRequest.model === modelName
                );
              }
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default base URL when not explicitly configured', async () => {
      // Generators for configuration values
      const apiKeyGen = fc.string({ minLength: 10, maxLength: 50 });
      const modelNameGen = fc.constantFrom('gpt-4', 'gpt-3.5-turbo');
      const movieTitleGen = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

      await fc.assert(
        fc.asyncProperty(
          apiKeyGen,
          modelNameGen,
          movieTitleGen,
          async (apiKey, modelName, movieTitle) => {
            // Create a new service instance and configure WITHOUT base URL
            const service = new LLMService();
            service.configure(apiKey, modelName); // No baseUrl parameter

            // Capture the request URL
            let capturedUrl: string | null = null;

            globalThis.fetch = vi.fn(async (url, _options) => {
              capturedUrl = url as string;

              // Return a valid mock response
              return {
                ok: true,
                status: 200,
                json: async () => ({
                  choices: [{
                    message: {
                      content: JSON.stringify({
                        synopsis: 'Test synopsis',
                        imdbScore: 7.5
                      })
                    }
                  }]
                })
              } as Response;
            });

            try {
              // Execute the search
              await service.searchMovie(movieTitle);

              // Property: Should use default OpenAI base URL
              expect(capturedUrl).toBe('https://api.openai.com/v1/chat/completions');

              return true;
            } catch (_error) {
              // Check if default URL was used before error
              return capturedUrl === 'https://api.openai.com/v1/chat/completions';
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: movie-synopsis-finder, Property 21: Authentication error shows clear message
   * Validates: Requirements 6.5
   * 
   * Property: For any LLM API response with authentication error status,
   * the application should display an error message indicating invalid credentials.
   */
  describe('Property 21: Authentication error shows clear message', () => {
    it('should throw AuthenticationError with clear message for any 401 response', async () => {
      // Generator for movie titles
      const movieTitleGen = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

      await fc.assert(
        fc.asyncProperty(movieTitleGen, async (movieTitle) => {
          // Mock fetch to return 401 authentication error
          globalThis.fetch = vi.fn(async () => {
            return {
              ok: false,
              status: 401,
              statusText: 'Unauthorized',
              text: async () => 'Invalid API key',
              json: async () => ({ error: 'Invalid API key' })
            } as Response;
          });

          // Property: Should throw an AuthenticationError with clear message
          try {
            await llmService.searchMovie(movieTitle);
            // If no error is thrown, the property fails
            return false;
          } catch (error) {
            // Check that it's an AuthenticationError
            if (error instanceof Error && error.name === 'AuthenticationError') {
              // Check that the message is clear and mentions credentials/API key
              const message = error.message.toLowerCase();
              const hasCredentialsMention = 
                message.includes('credential') || 
                message.includes('api key') ||
                message.includes('authentication') ||
                message.includes('invalid');
              
              // Check that the error has the correct status code
              const hasCorrectStatus = (error as any).statusCode === 401;
              
              return hasCredentialsMention && hasCorrectStatus;
            }
            // If it's not an AuthenticationError, the property fails
            return false;
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should distinguish authentication errors from other HTTP errors', async () => {
      // Generator for movie titles and non-401 error status codes
      const movieTitleGen = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);
      const errorStatusGen = fc.constantFrom(400, 403, 404, 429, 500, 502, 503);

      await fc.assert(
        fc.asyncProperty(movieTitleGen, errorStatusGen, async (movieTitle, statusCode) => {
          // Mock fetch to return non-401 error
          globalThis.fetch = vi.fn(async () => {
            return {
              ok: false,
              status: statusCode,
              statusText: 'Error',
              text: async () => 'Some error',
              json: async () => ({ error: 'Some error' })
            } as Response;
          });

          // Property: Should NOT throw AuthenticationError for non-401 errors
          try {
            await llmService.searchMovie(movieTitle);
            // If no error is thrown, the property fails
            return false;
          } catch (error) {
            // Should throw an error, but NOT an AuthenticationError
            if (error instanceof Error) {
              // Should be LLMError but not AuthenticationError
              return error.name !== 'AuthenticationError';
            }
            return false;
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: movie-synopsis-finder, Property 2: LLM response parsing extracts all fields
   * Validates: Requirements 1.2
   * 
   * Property: For any valid LLM response containing synopsis and IMDb score,
   * parsing that response should correctly extract both the synopsis text and numeric IMDb score.
   */
  describe('Property 2: LLM response parsing extracts all fields', () => {
    it('should correctly extract synopsis and IMDb score from any valid LLM response', async () => {
      // Generator for valid synopsis (non-empty strings)
      const validSynopsis = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);
      
      // Generator for valid IMDb scores (0-10)
      const validImdbScore = fc.float({ min: 0, max: 10, noNaN: true });

      await fc.assert(
        fc.asyncProperty(validSynopsis, validImdbScore, async (synopsis, imdbScore) => {
          // Create a valid LLM response with the generated data
          const responseContent = JSON.stringify({
            synopsis: synopsis,
            imdbScore: imdbScore
          });

          // Mock fetch to return the generated response
          globalThis.fetch = vi.fn(async () => {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                choices: [{
                  message: {
                    content: responseContent
                  }
                }]
              })
            } as Response;
          });

          // Execute the search
          const result = await llmService.searchMovie('Test Movie');

          // Property: The parsed result should contain the exact synopsis and IMDb score
          // Check that synopsis is extracted correctly (trimmed)
          expect(result.synopsis).toBe(synopsis.trim());
          
          // Check that IMDb score is extracted correctly
          expect(result.imdbScore).toBe(imdbScore);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should extract JSON from LLM responses wrapped in markdown code blocks', async () => {
      // Generator for valid synopsis and IMDb scores
      const validSynopsis = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);
      const validImdbScore = fc.float({ min: 0, max: 10, noNaN: true });

      await fc.assert(
        fc.asyncProperty(validSynopsis, validImdbScore, async (synopsis, imdbScore) => {
          // Create response wrapped in markdown code blocks (common LLM behavior)
          const jsonContent = JSON.stringify({
            synopsis: synopsis,
            imdbScore: imdbScore
          });
          const responseContent = `Here's the movie information:\n\`\`\`json\n${jsonContent}\n\`\`\``;

          // Mock fetch to return the wrapped response
          globalThis.fetch = vi.fn(async () => {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                choices: [{
                  message: {
                    content: responseContent
                  }
                }]
              })
            } as Response;
          });

          // Execute the search
          const result = await llmService.searchMovie('Test Movie');

          // Property: Should still extract correctly even with markdown wrapping
          expect(result.synopsis).toBe(synopsis.trim());
          expect(result.imdbScore).toBe(imdbScore);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should extract JSON from LLM responses with extra text', async () => {
      // Generator for valid synopsis and IMDb scores
      const validSynopsis = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);
      const validImdbScore = fc.float({ min: 0, max: 10, noNaN: true });

      await fc.assert(
        fc.asyncProperty(validSynopsis, validImdbScore, async (synopsis, imdbScore) => {
          // Create response with extra text before and after JSON
          const jsonContent = JSON.stringify({
            synopsis: synopsis,
            imdbScore: imdbScore
          });
          const responseContent = `Sure! Here's the information: ${jsonContent} Hope this helps!`;

          // Mock fetch to return the response with extra text
          globalThis.fetch = vi.fn(async () => {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                choices: [{
                  message: {
                    content: responseContent
                  }
                }]
              })
            } as Response;
          });

          // Execute the search
          const result = await llmService.searchMovie('Test Movie');

          // Property: Should extract correctly even with extra text
          expect(result.synopsis).toBe(synopsis.trim());
          expect(result.imdbScore).toBe(imdbScore);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
