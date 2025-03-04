import OpenAI from "openai";
import { OpenAIError } from "./errors";
import { log } from "./logger";
import type { StoryParams, StoryResponse } from "@shared/schema";
import { storage } from "../storage";
import { AI_PERSONALITY, STORY_UNIVERSE, ANALYSIS_PROMPT, STORY_PROMPT } from "./ai-guidelines";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;
const REQUEST_TIMEOUT = 30000;

function calculateBackoff(attempt: number, initialDelay: number): number {
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  const maxDelay = Math.min(exponentialDelay, MAX_RETRY_DELAY);
  return maxDelay * (0.75 + Math.random() * 0.5);
}

async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timeout')), REQUEST_TIMEOUT);
    });

    return await Promise.race([operation(), timeoutPromise]) as T;
  } catch (error) {
    log.apiError('OpenAI API Error:', error);
    const openAIError = OpenAIError.fromError(error);

    if (openAIError.retryable && retries > 0) {
      const backoffDelay = calculateBackoff(MAX_RETRIES - retries, delay);
      log.info(`Retrying OpenAI request after ${backoffDelay}ms. Attempts remaining: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return withRetry(operation, retries - 1, delay);
    }

    throw openAIError;
  }
}

export async function analyzeImage(base64Image: string): Promise<{
  name: string;
  personality: string;
  description: string;
  artStyle: string;
  suggestedNames: string[];
}> {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new OpenAIError("OpenAI API key is missing. Please set OPENAI_API_KEY environment variable.", undefined, 500, false);
    }
    
    log.info('Starting image analysis with OpenAI vision API');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: ANALYSIS_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this Yorkshire Terrier image and provide details in JSON format with:\n" +
                    "- name: A creative character name\n" +
                    "- personality: Their character traits and energy\n" +
                    "- description: Physical appearance details\n" +
                    "- artStyle: The artistic style used\n" +
                    "- suggestedNames: Array of 10 alternative creative names"
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image.startsWith('data:') 
                  ? base64Image 
                  : `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new OpenAIError("No content received from OpenAI");
    }

    log.info('Successfully received image analysis from OpenAI');

    const analysis = JSON.parse(content);

    if (!analysis.name || !analysis.personality || !analysis.description || !analysis.artStyle || !analysis.suggestedNames) {
      throw new OpenAIError("Invalid response format from OpenAI vision API");
    }

    // Ensure we have exactly 10 names
    while (analysis.suggestedNames.length < 10) {
      analysis.suggestedNames.push(`Yorkie ${analysis.suggestedNames.length + 1}`);
    }
    analysis.suggestedNames = analysis.suggestedNames.slice(0, 10);

    return analysis;
  } catch (error) {
    log.error('Image analysis error:', error);
    throw new OpenAIError(`Failed to analyze image: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
  }
}

export async function generateStory(params: StoryParams): Promise<StoryResponse> {
  try {
    log.info('Starting story generation with params:', {
      theme: params.theme,
      artStyle: params.artStyle.style,
      mood: params.mood
    });

    await storage.addDebugLog("openai", "request", {
      model: "gpt-3.5-turbo",
      params
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: STORY_PROMPT
        },
        {
          role: "user",
          content: JSON.stringify(params)
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    if (!response || !response.choices || response.choices.length === 0) {
      throw new OpenAIError("No response received from OpenAI");
    }

    const content = response.choices[0].message.content;
    if (!content) {
      throw new OpenAIError("No content received from OpenAI");
    }

    log.info('Successfully received story from OpenAI');

    await storage.addDebugLog("openai", "response", {
      content,
      usage: response.usage,
      timestamp: new Date().toISOString()
    });

    try {
      const parsedResponse = JSON.parse(content);
      if (!parsedResponse.title || !parsedResponse.content || !parsedResponse.metadata) {
        throw new OpenAIError("Invalid response format from OpenAI");
      }
      return { id: 0, ...parsedResponse } as StoryResponse;
    } catch (error) {
      log.error('Failed to parse OpenAI response:', error);
      throw new OpenAIError("Failed to parse story response");
    }
  } catch (error) {
    log.error('Story generation error:', error);
    await storage.addDebugLog("openai", "error", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params,
      timestamp: new Date().toISOString()
    });

    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError(`Failed to generate story: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
  }
}