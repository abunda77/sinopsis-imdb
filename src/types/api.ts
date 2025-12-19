/**
 * Request structure for LLM API calls (OpenAI-compatible format)
 */
export interface LLMRequest {
  /** Model identifier to use for the request */
  model: string;
  /** Array of messages in the conversation */
  messages: Array<{
    /** Role of the message sender */
    role: 'system' | 'user' | 'assistant';
    /** Content of the message */
    content: string;
  }>;
  /** Sampling temperature (optional, 0-2) */
  temperature?: number;
  /** Maximum tokens to generate (optional) */
  max_tokens?: number;
}

/**
 * Response structure from LLM API (OpenAI-compatible format)
 */
export interface LLMResponse {
  /** Array of completion choices */
  choices: Array<{
    /** Message object containing the response */
    message: {
      /** Content of the response */
      content: string;
    };
  }>;
}
