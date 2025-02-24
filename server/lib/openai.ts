import OpenAI from "openai";
import { OpenAIError } from "./errors";
import { log } from "./logger";
import type { StoryParams, StoryResponse } from "@shared/schema";
import { storage } from "../storage";
import { AI_PERSONALITY, STORY_UNIVERSE, ANALYSIS_PROMPT, STORY_PROMPT } from "./ai-guidelines";

// IMPORTANT: Always use gpt-3.5-turbo as our standard model
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeImage(base64Image: string): Promise<{
  name: string;
  personality: string;
  description: string;
  artStyle: string;
  suggestedNames: string[];
}> {
  try {
    log.info('Starting image analysis with OpenAI vision API');

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Always use gpt-3.5-turbo
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
                url: `data:image/jpeg;base64,${base64Image}`
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

    const prompt = `Create a magical children's story about a Yorkshire terrier at Uncle Mark's Farm with these elements:

Story Elements:
- Protagonist: A Yorkie who is ${params.protagonist.personality}
- Appearance: ${params.protagonist.appearance}
- Theme: ${params.theme}
- Mood: ${params.mood}
- Antagonist: ${params.antagonist.type} with personality: ${params.antagonist.personality}
- Farm Elements: ${params.farmElements.join(', ')}

Style Guidelines:
- Write in a whimsical, engaging style perfect for children
- Include magical elements and positive messages
- Create short, focused chapters
- Maintain a ${params.mood.toLowerCase()} tone throughout

Response Format:
{
  "title": "The story's title",
  "content": "Story with chapters separated by \\n\\n### Chapter N: Title\\n\\n",
  "metadata": {
    "wordCount": number,
    "chapters": number,
    "tone": "story tone",
    "protagonist": {
      "name": "character name",
      "personality": "key traits"
    }
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Always use gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: "You are a children's book author specializing in magical stories about Yorkshire terriers. Keep responses concise and engaging for young readers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

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

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 10000;
const REQUEST_TIMEOUT = 60000;

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