import type { AppConfig } from '../types/models';

/**
 * Configuration error thrown when required environment variables are missing
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validates that all required configuration values are present
 * @param config - The configuration object to validate
 * @throws {ConfigurationError} If any required configuration is missing
 */
function validateConfig(config: Partial<AppConfig>): asserts config is AppConfig {
  const missingFields: string[] = [];

  if (!config.apiKey || config.apiKey.trim() === '') {
    missingFields.push('API_KEY');
  }

  if (!config.modelName || config.modelName.trim() === '') {
    missingFields.push('MODEL_NAME');
  }

  // apiBaseUrl is optional now since we use proxy
  if (!config.apiBaseUrl) {
    config.apiBaseUrl = 'https://api.openai.com/v1'; // default value
  }

  if (missingFields.length > 0) {
    throw new ConfigurationError(
      `Missing required configuration: ${missingFields.join(', ')}. ` +
      `Please set these environment variables.`
    );
  }
}

/**
 * Loads and validates application configuration from environment variables
 * @returns {AppConfig} The validated configuration object
 * @throws {ConfigurationError} If required configuration is missing
 */
export function loadConfig(): AppConfig {
  const config: Partial<AppConfig> = {
    apiKey: import.meta.env.VITE_API_KEY,
    modelName: import.meta.env.VITE_MODEL_NAME,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.openai.com/v1',
  };

  validateConfig(config);

  return config;
}

/**
 * Attempts to load configuration and returns error message if validation fails
 * @returns {Object} Object containing either config or error message
 */
export function tryLoadConfig(): { config?: AppConfig; error?: string } {
  try {
    const config = loadConfig();
    return { config };
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return { error: error.message };
    }
    return { error: 'An unexpected error occurred while loading configuration' };
  }
}
