import OpenAI from "openai";
import { OpenAIError } from "./errors";
import { log } from "./logger";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 10000; // 10 seconds

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
    return await operation();
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

interface StoryParams {
  characteristics: string;
  colors: string;
  theme: string;
}

interface StoryResponse {
  title: string;
  content: string;
  metadata: {
    wordCount: number;
    chapters: number;
    tone: string;
    protagonist: {
      name: string;
      personality: string;
    };
  };
}

export async function generateStory(params: StoryParams): Promise<StoryResponse> {
  const prompt = `Create a vibrant and unique story set at Uncle Mark's Farm:
## World & Setting
• Uncle Mark's Farm is a special place where Yorkshire terriers play a vital role in protecting the farm's animals
• The farm is home to chickens and turkeys that need protection
• Hidden in the nearby woods lives a mysterious sorcerer who covets the farm's magical eggs
• The farm faces various challenges from woodland creatures under the sorcerer's influence

## Your Protagonist
Create a unique Yorkshire terrier character with:
• Physical traits: ${params.colors}
• Key characteristics: ${params.characteristics}
• Choose a creative, memorable name that reflects their personality
• They join two established farm defenders: Pawel and Pawleen

## Story Elements
• Theme: ${params.theme || 'Protecting the Farm'}
• Style: Contemporary, with modern language that resonates with young readers
• Length: 3,000-5,000 words
• Structure: Multiple chapters that flow naturally

## Creative Guidelines
• Give your protagonist a distinct voice and personality
• Create memorable scenes showing the farm's daily life and magical elements
• Include both action sequences and character development moments
• Show how the new Yorkie learns from and works with the existing farm protectors
• Feel free to add creative subplots that enrich the main story

Provide your response in this exact JSON format:
{
  "title": "Your creative story title",
  "content": "The complete story as a single string with chapters separated by \\n\\n### Chapter N: Title\\n\\n",
  "metadata": {
    "wordCount": number,
    "chapters": number,
    "tone": "The story's overall tone",
    "protagonist": {
      "name": "Your unique character name",
      "personality": "Key personality traits that make them special"
    }
  }
}`;

  return withRetry(async () => {
    log.info('Initiating story generation request to OpenAI');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a imaginative children's book author with a talent for creating unique and memorable characters. You specialize in stories that blend magic, adventure, and heart, set in the special world of Uncle Mark's Farm. While the farm setting and its magical nature are fixed elements, you have complete creative freedom in developing distinct personalities, creative names, and engaging subplots that make each story feel fresh and unique."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new OpenAIError("No content received from OpenAI");
    }

    log.info('Successfully received story from OpenAI');
    return JSON.parse(content) as StoryResponse;
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