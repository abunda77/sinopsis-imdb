import type { MovieInfo, AppConfig } from '../types/models';
import type { ValidationResult } from '../types/validation';

/**
 * Service for validating user input and data integrity
 */
export class ValidationService {
  /**
   * Validates a movie title input
   * @param title - The movie title to validate
   * @returns ValidationResult indicating if the title is valid
   */
  validateMovieTitle(title: string): ValidationResult {
    const errors: string[] = [];

    // Check if title is empty or only whitespace
    if (!title || title.trim().length === 0) {
      errors.push('Movie title cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates movie information from LLM response
   * @param info - The movie information to validate
   * @returns ValidationResult indicating if the movie info is valid
   */
  validateMovieInfo(info: MovieInfo): ValidationResult {
    const errors: string[] = [];

    // Validate synopsis
    if (!info.synopsis || info.synopsis.trim().length === 0) {
      errors.push('Synopsis cannot be empty');
    }

    // Validate IMDb score
    if (typeof info.imdbScore !== 'number') {
      errors.push('IMDb score must be a number');
    } else if (info.imdbScore < 0 || info.imdbScore > 10) {
      errors.push('IMDb score must be between 0 and 10');
    } else if (isNaN(info.imdbScore)) {
      errors.push('IMDb score cannot be NaN');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates application configuration
   * @param config - The application configuration to validate
   * @returns ValidationResult indicating if the config is valid
   */
  validateConfig(config: AppConfig): ValidationResult {
    const errors: string[] = [];

    // Validate API key
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      errors.push('API key is required');
    }

    // Validate model name
    if (!config.modelName || config.modelName.trim().length === 0) {
      errors.push('Model name is required');
    }

    // Validate API base URL
    if (!config.apiBaseUrl || config.apiBaseUrl.trim().length === 0) {
      errors.push('API base URL is required');
    } else {
      // Check if it's a valid URL format
      try {
        new URL(config.apiBaseUrl);
      } catch {
        errors.push('API base URL must be a valid URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
