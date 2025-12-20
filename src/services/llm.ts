import type { MovieInfo } from '../types/models';
import type { LLMRequest, LLMResponse } from '../types/api';

/**
 * Custom error for LLM-related failures
 */
export class LLMError extends Error {
  public readonly statusCode?: number;
  
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'LLMError';
    this.statusCode = statusCode;
  }
}

/**
 * Custom error for authentication failures
 */
export class AuthenticationError extends LLMError {
  constructor(message: string = 'Invalid API credentials. Please check your API key.') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Custom error for parsing failures
 */
export class ParsingError extends LLMError {
  constructor(message: string) {
    super(message);
    this.name = 'ParsingError';
  }
}

/**
 * LLMService handles communication with OpenAI-compatible LLM APIs
 */
export class LLMService {
  private apiKey: string = '';
  private modelName: string = '';

  /**
   * Configure the LLM service with API credentials and settings
   * @param apiKey - API key for authentication
   * @param modelName - Model identifier to use for requests
   * @param apiBaseUrl - Base URL for the API (optional, kept for backward compatibility but not used)
   */
  configure(apiKey: string, modelName: string, apiBaseUrl?: string): void {
    this.apiKey = apiKey;
    this.modelName = modelName;
    // apiBaseUrl parameter kept for backward compatibility but not used
    // All requests go through /api proxy in both dev and production
  }

  /**
   * Search for movie information using the LLM
   * @param title - Movie title to search for
   * @returns Promise resolving to MovieInfo with synopsis and IMDb score
   * @throws {LLMError} If the request fails or response is invalid
   * @throws {AuthenticationError} If authentication fails
   * @throws {ParsingError} If response parsing fails
   */
  async searchMovie(title: string): Promise<MovieInfo> {
    if (!this.apiKey || !this.modelName) {
      throw new LLMError('LLM service not configured. Call configure() first.');
    }

    // Create the structured prompt with clear instructions
    const request: LLMRequest = {
      model: this.modelName,
      messages: [
        {
          role: 'system',
          content: `You are a movie information assistant. When given a movie title, you MUST respond with ONLY a valid JSON object in this exact format:
{
  "synopsis": "Movie synopsis in Indonesian language",
  "imdbScore": 7.5
}

IMPORTANT RULES:
- The imdbScore MUST be a number between 0 and 10 (e.g., 7.5, 8.2, 6.0)
- Do NOT use strings for imdbScore (wrong: "7.5", correct: 7.5)
- Translate the synopsis to Indonesian language
- Do NOT include any text outside the JSON object
- If you cannot find the exact IMDb score, provide your best estimate as a number`
        },
        {
          role: 'user',
          content: `Find information for the movie: ${title}`
        }
      ],
      temperature: 0.3,
      max_tokens: 600
    };

    try {
      // Always use relative path - will use Vite proxy in dev, needs backend proxy in production
      const apiUrl = '/api/chat/completions';

      // Send request to LLM API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });

      // Handle authentication errors
      if (response.status === 401) {
        throw new AuthenticationError();
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new LLMError(
          `LLM API request failed with status ${response.status}: ${errorText}`,
          response.status
        );
      }

      // Parse response
      const data: LLMResponse = await response.json();

      // Validate response structure
      if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new ParsingError('Invalid response structure from LLM API');
      }

      const content = data.choices[0].message.content;

      // Parse the movie information from the response
      return this.parseMovieInfo(content);

    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof LLMError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new LLMError('Network error: Unable to reach LLM API. Please check your connection.');
      }

      // Handle other unexpected errors
      throw new LLMError(`Unexpected error during LLM request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse movie information from LLM response content
   * @param content - Raw content from LLM response
   * @returns MovieInfo object with synopsis and IMDb score
   * @throws {ParsingError} If parsing fails
   */
  private parseMovieInfo(content: string): MovieInfo {
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to extract JSON from the response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new ParsingError(`No JSON object found in LLM response. Response: ${content.substring(0, 200)}`);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate synopsis
      if (typeof parsed.synopsis !== 'string' || !parsed.synopsis.trim()) {
        throw new ParsingError('Missing or invalid synopsis in LLM response');
      }

      // Handle IMDb score - convert string to number if needed
      let imdbScore: number;
      
      if (typeof parsed.imdbScore === 'number') {
        imdbScore = parsed.imdbScore;
      } else if (typeof parsed.imdbScore === 'string') {
        // Try to parse string to number
        imdbScore = parseFloat(parsed.imdbScore);
        if (isNaN(imdbScore)) {
          throw new ParsingError(`IMDb score is not a valid number: ${parsed.imdbScore}`);
        }
      } else if (parsed.imdb_score !== undefined) {
        // Try alternative field name
        imdbScore = typeof parsed.imdb_score === 'number' 
          ? parsed.imdb_score 
          : parseFloat(parsed.imdb_score);
      } else if (parsed.rating !== undefined) {
        // Try another alternative field name
        imdbScore = typeof parsed.rating === 'number' 
          ? parsed.rating 
          : parseFloat(parsed.rating);
      } else {
        throw new ParsingError('Missing IMDb score in LLM response. Expected field: imdbScore');
      }

      // Validate score range
      if (imdbScore < 0 || imdbScore > 10) {
        throw new ParsingError(`IMDb score out of range (must be 0-10): ${imdbScore}`);
      }

      return {
        synopsis: parsed.synopsis.trim(),
        imdbScore: imdbScore
      };

    } catch (error) {
      if (error instanceof ParsingError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new ParsingError(`Failed to parse JSON from LLM response: ${error.message}`);
      }

      throw new ParsingError(`Unexpected error parsing LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
