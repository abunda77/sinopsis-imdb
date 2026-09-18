import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { loadConfig, tryLoadConfig, ConfigurationError } from './config';

describe('Configuration Management', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    // Reset environment variables before each test
    import.meta.env.VITE_MODEL_NAME = '';
    import.meta.env.VITE_API_BASE_URL = '';
  });

  afterEach(() => {
    // Restore original environment
    Object.assign(import.meta.env, originalEnv);
  });

  describe('loadConfig', () => {
    it('should load valid configuration', () => {
        import.meta.env.VITE_MODEL_NAME = 'gpt-4';
      import.meta.env.VITE_API_BASE_URL = 'https://api.openai.com/v1';

      const config = loadConfig();

      expect(config.modelName).toBe('gpt-4');
      expect(config.apiBaseUrl).toBe('https://api.openai.com/v1');
    });

    it('should use default API base URL if not provided', () => {
        import.meta.env.VITE_MODEL_NAME = 'gpt-4';

      const config = loadConfig();

      expect(config.apiBaseUrl).toBe('https://api.openai.com/v1');
    });

    it('should NOT require API_KEY: the key stays server-side', () => {
      import.meta.env.VITE_MODEL_NAME = 'gpt-4';

      const config = loadConfig();
      expect(config.modelName).toBe('gpt-4');
      // The browser must never receive a credential
      expect(config).not.toHaveProperty('apiKey');
    });

    it('should throw ConfigurationError when MODEL_NAME is missing', () => {
  
      expect(() => loadConfig()).toThrow(ConfigurationError);
      expect(() => loadConfig()).toThrow(/Missing required configuration.*MODEL_NAME/);
    });

    it('should throw ConfigurationError when multiple fields are missing', () => {
      expect(() => loadConfig()).toThrow(ConfigurationError);
      expect(() => loadConfig()).toThrow(/MODEL_NAME/);
    });

    it('should reject empty string MODEL_NAME', () => {
        import.meta.env.VITE_MODEL_NAME = '   ';

      expect(() => loadConfig()).toThrow(ConfigurationError);
      expect(() => loadConfig()).toThrow(/MODEL_NAME/);
    });
  });

  describe('tryLoadConfig', () => {
    it('should return config when valid', () => {
        import.meta.env.VITE_MODEL_NAME = 'gpt-4';

      const result = tryLoadConfig();

      expect(result.config).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error message when configuration is invalid', () => {
      const result = tryLoadConfig();

      expect(result.config).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Missing required configuration');
    });

    it('should return specific error message for missing fields', () => {
  
      const result = tryLoadConfig();

      expect(result.error).toContain('MODEL_NAME');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: movie-synopsis-finder, Property 19: Missing configuration shows error
     * Validates: Requirements 6.3
     * 
     * For any missing required configuration value (API key or model name),
     * the application should display a configuration error message on initialization.
     */
    it('should show error for any missing required configuration', () => {
      // Generator for configuration with at least one missing field
      const incompleteConfigGen = fc.record({
        modelName: fc.option(fc.string(), { nil: undefined }),
        apiBaseUrl: fc.option(fc.string(), { nil: undefined }),
      }).filter(config => {
        // Ensure at least one required field is missing or empty
        const hasEmptyModelName = !config.modelName || config.modelName.trim() === '';
        return hasEmptyModelName;
      });

      fc.assert(
        fc.property(incompleteConfigGen, (config) => {
          // Set up environment with the incomplete configuration
          import.meta.env.VITE_MODEL_NAME = config.modelName || '';
          import.meta.env.VITE_API_BASE_URL = config.apiBaseUrl || '';

          // Try to load configuration
          const result = tryLoadConfig();

          // Property: Should always return an error when configuration is incomplete
          expect(result.error).toBeDefined();
          expect(result.config).toBeUndefined();
          expect(result.error).toContain('Missing required configuration');

          // Verify the error message mentions the missing field(s)
          if (!config.modelName || config.modelName.trim() === '') {
            expect(result.error).toContain('MODEL_NAME');
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
