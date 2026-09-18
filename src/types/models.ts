/**
 * Represents a complete movie search result stored in the database
 */
export interface MovieResult {
  /** Unique identifier (UUID) */
  id: string;
  /** Movie title */
  title: string;
  /** Movie synopsis from LLM */
  synopsis: string;
  /** IMDb score (0-10) */
  imdbScore: number;
  /** Timestamp of search */
  searchedAt: Date;
  /** Timestamp when saved (null if not saved) */
  savedAt: Date | null;
}

/**
 * Represents the parsed information from LLM response
 */
export interface MovieInfo {
  /** Movie synopsis */
  synopsis: string;
  /** IMDb score (0-10) */
  imdbScore: number;
}

/**
 * Application configuration from environment variables
 */
export interface AppConfig {
  /** Model name to use for LLM requests */
  modelName: string;
  /** Base URL for API (default: https://api.openai.com/v1) */
  apiBaseUrl: string;
}
