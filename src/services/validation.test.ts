import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ValidationService } from './validation';
import type { MovieInfo, AppConfig } from '../types/models';

describe('ValidationService', () => {
  const validationService = new ValidationService();

  describe('validateMovieTitle', () => {
    it('should accept valid movie titles', () => {
      const result = validationService.validateMovieTitle('The Matrix');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty strings', () => {
      const result = validationService.validateMovieTitle('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Movie title cannot be empty');
    });

    it('should reject whitespace-only strings', () => {
      const result = validationService.validateMovieTitle('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Movie title cannot be empty');
    });

    it('should reject strings with only tabs and newlines', () => {
      const result = validationService.validateMovieTitle('\t\n  \t');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Movie title cannot be empty');
    });

    /**
     * Feature: movie-synopsis-finder, Property 3: Empty title validation
     * Validates: Requirements 1.5
     * 
     * Property: For any string composed entirely of whitespace or empty string,
     * attempting to search should be rejected and no LLM request should be initiated.
     */
    it('should reject any whitespace-only or empty string (property-based)', () => {
      // Generator for whitespace-only strings
      const whitespaceString = fc.oneof(
        fc.constant(''), // empty string
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r', '\v', '\f')).map(arr => arr.join('')), // whitespace characters
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r', '\v', '\f'), { minLength: 1 }).map(arr => arr.join('')) // at least one whitespace
      );

      fc.assert(
        fc.property(whitespaceString, (title) => {
          const result = validationService.validateMovieTitle(title);
          
          // Property: All whitespace-only or empty strings should be rejected
          return result.isValid === false && result.errors.length > 0;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('validateMovieInfo', () => {
    it('should accept valid movie info', () => {
      const info: MovieInfo = {
        synopsis: 'A great movie about the future',
        imdbScore: 8.5,
      };
      const result = validationService.validateMovieInfo(info);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty synopsis', () => {
      const info: MovieInfo = {
        synopsis: '',
        imdbScore: 8.5,
      };
      const result = validationService.validateMovieInfo(info);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Synopsis cannot be empty');
    });

    it('should reject whitespace-only synopsis', () => {
      const info: MovieInfo = {
        synopsis: '   ',
        imdbScore: 8.5,
      };
      const result = validationService.validateMovieInfo(info);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Synopsis cannot be empty');
    });

    it('should reject IMDb score below 0', () => {
      const info: MovieInfo = {
        synopsis: 'A great movie',
        imdbScore: -1,
      };
      const result = validationService.validateMovieInfo(info);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('IMDb score must be between 0 and 10');
    });

    it('should reject IMDb score above 10', () => {
      const info: MovieInfo = {
        synopsis: 'A great movie',
        imdbScore: 11,
      };
      const result = validationService.validateMovieInfo(info);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('IMDb score must be between 0 and 10');
    });

    it('should reject NaN IMDb score', () => {
      const info: MovieInfo = {
        synopsis: 'A great movie',
        imdbScore: NaN,
      };
      const result = validationService.validateMovieInfo(info);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('IMDb score cannot be NaN');
    });

    it('should accept IMDb score at boundary 0', () => {
      const info: MovieInfo = {
        synopsis: 'A terrible movie',
        imdbScore: 0,
      };
      const result = validationService.validateMovieInfo(info);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept IMDb score at boundary 10', () => {
      const info: MovieInfo = {
        synopsis: 'A perfect movie',
        imdbScore: 10,
      };
      const result = validationService.validateMovieInfo(info);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateConfig', () => {
    it('should accept valid configuration', () => {
      const config: AppConfig = {
        apiKey: 'sk-test123',
        modelName: 'gpt-4',
        apiBaseUrl: 'https://api.openai.com/v1',
      };
      const result = validationService.validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty API key', () => {
      const config: AppConfig = {
        apiKey: '',
        modelName: 'gpt-4',
        apiBaseUrl: 'https://api.openai.com/v1',
      };
      const result = validationService.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });

    it('should reject whitespace-only API key', () => {
      const config: AppConfig = {
        apiKey: '   ',
        modelName: 'gpt-4',
        apiBaseUrl: 'https://api.openai.com/v1',
      };
      const result = validationService.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API key is required');
    });

    it('should reject empty model name', () => {
      const config: AppConfig = {
        apiKey: 'sk-test123',
        modelName: '',
        apiBaseUrl: 'https://api.openai.com/v1',
      };
      const result = validationService.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Model name is required');
    });

    it('should reject empty API base URL', () => {
      const config: AppConfig = {
        apiKey: 'sk-test123',
        modelName: 'gpt-4',
        apiBaseUrl: '',
      };
      const result = validationService.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API base URL is required');
    });

    it('should reject invalid URL format', () => {
      const config: AppConfig = {
        apiKey: 'sk-test123',
        modelName: 'gpt-4',
        apiBaseUrl: 'not-a-valid-url',
      };
      const result = validationService.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API base URL must be a valid URL');
    });

    it('should collect multiple errors', () => {
      const config: AppConfig = {
        apiKey: '',
        modelName: '',
        apiBaseUrl: 'invalid',
      };
      const result = validationService.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });
});
