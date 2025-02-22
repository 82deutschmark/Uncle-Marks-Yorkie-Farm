import { OpenAI } from "openai";

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public cause?: unknown,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class DiscordError extends APIError {
  constructor(
    message: string,
    statusCode: number = 500,
    retryable: boolean = false
  ) {
    super(message, statusCode, undefined, retryable);
    this.name = 'DiscordError';
  }
}

export class OpenAIError extends APIError {
  constructor(
    message: string, 
    cause?: unknown,
    statusCode: number = 500,
    retryable: boolean = false
  ) {
    super(message, statusCode, cause, retryable);
    this.name = 'OpenAIError';
  }

  static fromError(error: unknown): OpenAIError {
    if (error instanceof OpenAI.APIError) {
      // Handle rate limits
      if (error.status === 429) {
        return new OpenAIError(
          'Rate limit exceeded. Please try again in a few moments.',
          error,
          429,
          true // Rate limits are retryable
        );
      }

      // Handle authentication errors
      if (error.status === 401) {
        return new OpenAIError(
          'Authentication failed. Please try again later.',
          error,
          401,
          false
        );
      }

      // Handle model-specific errors
      if (error.status === 404 && error.message.includes('does not exist')) {
        return new OpenAIError(
          'The AI model is temporarily unavailable. Please try again later.',
          error,
          404,
          true
        );
      }

      // Handle context length errors
      if (error.message.includes('maximum context length')) {
        return new OpenAIError(
          'The content is too long for processing. Please try with a shorter input.',
          error,
          413,
          false
        );
      }

      // Handle content policy violations
      if (error.status === 400 && error.message.includes('content policy')) {
        return new OpenAIError(
          'The content could not be processed due to content restrictions.',
          error,
          400,
          false
        );
      }

      // Handle general server errors
      if (error.status >= 500) {
        return new OpenAIError(
          'AI service is temporarily unavailable. Please try again later.',
          error,
          error.status,
          true
        );
      }

      return new OpenAIError(
        `AI service error: ${error.message}`,
        error,
        error.status || 500,
        error.status >= 500 || error.status === 429
      );
    }

    // Handle network or other errors
    if (error instanceof Error) {
      return new OpenAIError(
        `Connection error: ${error.message}`,
        error,
        503,
        true
      );
    }

    return new OpenAIError(
      'An unexpected error occurred',
      error,
      500,
      true
    );
  }
}