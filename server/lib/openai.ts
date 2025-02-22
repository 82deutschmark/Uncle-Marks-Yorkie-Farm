import OpenAI from "openai";
import { OpenAIError } from "./errors";
import { log } from "./logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!(error instanceof OpenAI.APIError)) {
      throw OpenAIError.fromError(error);
    }

    // Don't retry on authentication errors or invalid requests
    if (error.status === 401 || error.status === 400) {
      throw OpenAIError.fromError(error);
    }

    // Only retry on rate limits or server errors
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      log(`Retrying OpenAI request after ${delay}ms. Attempts remaining: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }

    throw OpenAIError.fromError(error);
  }
}

interface StoryParams {
  characteristics: string;
  colors: string;
  setting: string;
  theme: string;
  antagonist: string;
}

interface StoryResponse {
  title: string;
  content: string;
  metadata: {
    wordCount: number;
    chapters: number;
    tone: string;
  };
}

interface CharacterProfile {
  name: string;
  personality: string;
  description: string;
}

export async function generateStory(params: StoryParams): Promise<StoryResponse> {
  const setting = params.setting || "Uncle Mark's magical Yorkie farm";
  const tone = "Gen Z";

  const prompt = `Create a charming Yorkshire terrier story with these parameters:
  - Yorkshire Terrier: A ${params.colors} Yorkie with these traits: ${params.characteristics}
  - Setting: ${setting}
  - Theme: ${params.theme}
  - Tone: ${tone}
  - Antagonist: ${params.antagonist}

  Story Context:
  - The story takes place at Uncle Mark's magical Yorkie farm
  - Use Gen Z slang and references to make the story relatable and fun
  - Yorkshire terriers have a natural rivalry with squirrels and other rodents

  Requirements:
  - Story should be between 3,000-5,000 words
  - Include multiple chapters
  - Use descriptive, engaging language suitable for a visual novel

  Provide the response as a JSON object with:
  - title: story title
  - content: full story text with chapter breaks
  - metadata: containing wordCount, number of chapters, and overall tone`;

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a creative children's book author specializing in Yorkshire terrier adventures with a Gen Z twist."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 8000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new OpenAIError("No content received from OpenAI");
    }

    return JSON.parse(content) as StoryResponse;
  });
}

export async function analyzeImage(base64Image: string): Promise<CharacterProfile> {
  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Yorkshire terrier expert and creative character designer with a Gen Z flair."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Create a detailed character profile for the Yorkshire terrier in this image. Include a unique Gen Z style name, personality traits, and vivid description. Format as JSON with name, personality, and description fields."
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

    return JSON.parse(content) as CharacterProfile;
  });
}