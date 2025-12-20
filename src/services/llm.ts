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
   * @param _apiBaseUrl - Base URL for the API (optional, kept for backward compatibility but not used)
   */
  configure(apiKey: string, modelName: string, _apiBaseUrl?: string): void {
    this.apiKey = apiKey;
    this.modelName = modelName;
    // _apiBaseUrl parameter kept for backward compatibility but not used
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
          content: `You are a movie information assistant. You MUST respond with ONLY a valid JSON object, nothing else.

REQUIRED JSON FORMAT (copy this exactly):
{"synopsis": "Movie synopsis in Indonesian language", "imdbScore": 7.5}

CRITICAL RULES:
1. Return ONLY the JSON object, no other text before or after
2. The imdbScore MUST be a number (not a string), between 0 and 10
3. Write the synopsis in Indonesian language
4. Do NOT include markdown code blocks or any formatting
5. Do NOT include explanations or additional text

Example valid response:
{"synopsis": "Film ini menceritakan tentang...", "imdbScore": 8.2}`
        },
        {
          role: 'user',
          content: `Return movie information for: ${title}

Remember: Return ONLY the JSON object with synopsis (in Indonesian) and imdbScore (as number).`
        }
      ],
      temperature: 0.2,
      max_tokens: 600
    };

    try {
      // Always use relative path - will use Vite proxy in dev, needs backend proxy in production
      const apiUrl = '/api/chat/completions';

      console.log('Sending request to:', apiUrl);
      console.log('Request body:', JSON.stringify(request, null, 2));

      // Send request to LLM API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Handle authentication errors
      if (response.status === 401) {
        throw new AuthenticationError();
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('API error response:', errorText);
        throw new LLMError(
          `LLM API request failed with status ${response.status}: ${errorText}`,
          response.status
        );
      }

      // Parse response
      const data: LLMResponse = await response.json();
      console.log('Response data:', data);

      // Validate response structure
      if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        console.error('Invalid response structure:', data);
        throw new ParsingError('Invalid response structure from LLM API');
      }

      const content = data.choices[0].message.content;
      console.log('LLM content:', content);

      // Parse the movie information from the response
      return this.parseMovieInfo(content);

    } catch (error) {
      console.error('Error in searchMovie:', error);
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
      console.log('Parsing movie info from content:', content.substring(0, 500));
      
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      console.log('Clean content:', cleanContent.substring(0, 500));
      
      // Try to extract JSON from the response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in content');
        throw new ParsingError(`No JSON object found in LLM response. Response: ${content.substring(0, 200)}`);
      }

      console.log('JSON match:', jsonMatch[0]);
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Parsed object:', parsed);

      // Validate synopsis
      if (typeof parsed.synopsis !== 'string' || !parsed.synopsis.trim()) {
        console.error('Invalid synopsis:', parsed.synopsis);
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
          console.error('Invalid imdbScore string:', parsed.imdbScore);
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
        console.error('No imdbScore field found. Parsed object:', parsed);
        throw new ParsingError('Missing IMDb score in LLM response. Expected field: imdbScore');
      }

      console.log('Parsed imdbScore:', imdbScore);

      // Validate score range
      if (imdbScore < 0 || imdbScore > 10) {
        console.error('imdbScore out of range:', imdbScore);
        throw new ParsingError(`IMDb score out of range (must be 0-10): ${imdbScore}`);
      }

      const result = {
        synopsis: parsed.synopsis.trim(),
        imdbScore: imdbScore
      };
      
      console.log('Final parsed result:', result);
      return result;

    } catch (error) {
      console.error('Error in parseMovieInfo:', error);
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
