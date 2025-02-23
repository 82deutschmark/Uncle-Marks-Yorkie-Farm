import OpenAI from "openai";
import { OpenAIError } from "./errors";
import { log } from "./logger";
import type { StoryParams, StoryResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 10000; // 10 seconds
const REQUEST_TIMEOUT = 60000; // 60 seconds timeout

// Exponential backoff with jitter
function calculateBackoff(attempt: number, initialDelay: number): number {
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  const maxDelay = Math.min(exponentialDelay, MAX_RETRY_DELAY);
  return maxDelay * (0.75 + Math.random() * 0.5); // Add jitter
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

export async function generateStory(params: StoryParams): Promise<StoryResponse> {
  return withRetry(async () => {
    try {
      log.info('Initiating story generation request to OpenAI', {
        model: "gpt-4o",
        theme: params.theme,
        artStyle: params.artStyle.style
      });

      const prompt = `Create a magical children's story about a Yorkshire terrier at Uncle Mark's Farm with these elements:

Story Elements:
- Protagonist: A Yorkie who is ${params.protagonist.personality}
- Appearance: ${params.protagonist.appearance}
- Theme: ${params.theme}
- Mood: ${params.mood}
- Antagonist: ${params.antagonist.type} - ${params.antagonist.personality}
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
        model: "gpt-4o",
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

      // Parse and validate the response
      const parsedResponse = JSON.parse(content);
      if (!parsedResponse.title || !parsedResponse.content || !parsedResponse.metadata) {
        throw new OpenAIError("Invalid response format from OpenAI");
      }

      log.info('Successfully received story from OpenAI');
      // Add a placeholder ID for now, the actual ID will be set when saved to the database
      return { id: 0, ...parsedResponse } as StoryResponse;
    } catch (error) {
      if (error instanceof OpenAIError) {
        throw error;
      }
      throw new OpenAIError(`Failed to generate story: ${error.message}`);
    }
  });
}

interface CharacterImagePrompt {
  personality: string;
  appearance: string;
  artStyle: {
    style: string;
    description: string;
  };
}

export async function generateCharacterImagePrompt(params: CharacterImagePrompt): Promise<string> {
  return withRetry(async () => {
    log.info('Generating character image prompt');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating detailed, vivid art prompts for MidJourney. Format prompts to bring Yorkshire Terrier characters to life in various artistic styles."
        },
        {
          role: "user",
          content: `Create a MidJourney prompt for a Yorkshire Terrier character with:
Personality: ${params.personality}
Appearance: ${params.appearance}
Art Style: ${params.artStyle.style} - ${params.artStyle.description}

The prompt should be detailed and incorporate the art style while maintaining the Yorkie's key characteristics.`
        }
      ],
      max_tokens: 500
    });

    const prompt = response.choices[0].message.content;
    if (!prompt) {
      throw new OpenAIError("No prompt generated from OpenAI");
    }

    return prompt;
  });
}

interface CharacterProfile {
  name: string;
  personality: string;
  description: string;
}

export async function analyzeImage(base64Image: string): Promise<CharacterProfile> {
  return withRetry(async () => {
    log.info('Initiating image analysis request to OpenAI');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a creative character designer with expertise in Yorkshire terriers. Create unique, memorable characters that feel fresh and original while staying true to Yorkie traits like their tiny size, intelligence, and spirited nature. Think beyond standard names and personalities - each character should feel special and distinct."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Study this Yorkshire terrier's image and create a vibrant character profile with:
1. A memorable, creative name that captures their unique essence
2. A distinctive personality that makes them stand out
3. A vivid physical description highlighting what makes them special

Format your response as JSON with:
- name: Their unique name
- personality: Their special character traits
- description: Their distinctive physical features`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new OpenAIError("No content received from OpenAI");
    }

    log.info('Successfully received character profile from OpenAI');
    return JSON.parse(content) as CharacterProfile;
  });
}