import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppConfig } from '../types/models';
import { tryLoadConfig } from '../lib/config';
import { LLMService } from '../services/llm';

/**
 * Context value interface for configuration management
 */
interface ConfigContextValue {
  /** Application configuration */
  config: AppConfig | null;
  /** Configuration error message if loading failed */
  configError: string | null;
  /** Whether configuration is loaded */
  isConfigured: boolean;
  /** LLM service instance configured with the app config */
  llmService: LLMService;
  /** Reload configuration from environment variables */
  reloadConfig: () => void;
}

/**
 * Config Context for managing API configuration
 */
const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

/**
 * Props for ConfigProvider component
 */
interface ConfigProviderProps {
  children: ReactNode;
}

/**
 * ConfigProvider component that wraps the application and provides configuration
 */
export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [llmService] = useState<LLMService>(() => new LLMService());

  /**
   * Load configuration from environment variables
   */
  const loadConfiguration = () => {
    const result = tryLoadConfig();
    
    if (result.error) {
      setConfigError(result.error);
      setConfig(null);
    } else if (result.config) {
      setConfig(result.config);
      setConfigError(null);
      
      // Configure the LLM service with the loaded config
      llmService.configure(
        result.config.apiKey,
        result.config.modelName,
        result.config.apiBaseUrl
      );
    }
  };

  /**
   * Load configuration on mount
   */
  useEffect(() => {
    loadConfiguration();
  }, []);

  /**
   * Reload configuration (useful for testing or config changes)
   */
  const reloadConfig = () => {
    loadConfiguration();
  };

  const value: ConfigContextValue = {
    config,
    configError,
    isConfigured: config !== null && configError === null,
    llmService,
    reloadConfig,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

/**
 * Custom hook to use the Config context
 * @throws {Error} If used outside of ConfigProvider
 */
export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
