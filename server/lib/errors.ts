import { OpenAI } from "openai";

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class OpenAIError extends APIError {
  constructor(message: string, cause?: unknown) {
    super(message, 500, cause);
    this.name = 'OpenAIError';
  }

  static fromError(error: unknown): OpenAIError {
    if (error instanceof OpenAI.APIError) {
      // Handle rate limits specially
      if (error.status === 429) {
        return new OpenAIError('Rate limit exceeded. Please try again later.', error);
      }
      // Handle authentication errors
      if (error.status === 401) {
        return new OpenAIError('Authentication failed. Please check your API key.', error);
      }
      // Handle model-specific errors
      if (error.status === 404 && error.message.includes('does not exist')) {
        return new OpenAIError('The requested AI model is not available. Please try again later.', error);
      }
      return new OpenAIError(`OpenAI API error: ${error.message}`, error);
    }
    // Handle network or other errors
    if (error instanceof Error) {
      return new OpenAIError(`Unexpected error: ${error.message}`, error);
    }
    return new OpenAIError('An unknown error occurred', error);
  }
}
