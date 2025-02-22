import OpenAI from "openai";
import { OpenAIError } from "./errors";
import { log } from "./logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

// Exponential backoff with jitter
function calculateBackoff(attempt: number, initialDelay: number): number {
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  const maxDelay = Math.min(exponentialDelay, MAX_RETRY_DELAY);
  // Add jitter to prevent thundering herd
  return maxDelay * (0.75 + Math.random() * 0.5);
}

async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const openAIError = OpenAIError.fromError(error);

    // Don't retry if the error is not retryable
    if (!openAIError.retryable) {
      throw openAIError;
    }

    // Only retry if we have attempts left
    if (retries > 0) {
      const backoffDelay = calculateBackoff(MAX_RETRIES - retries, delay);
      log(`Retrying OpenAI request after ${backoffDelay}ms. Attempts remaining: ${retries}`);

      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return withRetry(operation, retries - 1, delay);
    }

    throw openAIError;
  }
}

interface StoryParams {
  characteristics: string;
  colors: string;
  setting: string;
  theme: string;
  antagonist: string;
  yorkieName?: string;
  yorkieGender?: 'male' | 'female';
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
      gender: string;
      personality: string;
    };
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
  const yorkieName = params.yorkieName || (params.yorkieGender === 'male' ? 'Pawel' : 'Pawleen');
  const defaultPersonality = params.yorkieGender === 'male' ? 
    'brave and impulsive, often acting without thinking' : 
    'intelligent and sweet, always thinking before acting';

  const prompt = `Create a Yorkshire terrier story with these parameters:
  - Protagonist: A ${params.colors} Yorkie named ${yorkieName} with these traits: ${params.characteristics || defaultPersonality}
  - Setting: ${setting}
  - Theme: ${params.theme}
  - Tone: ${tone}

  Story Context:
  - The story takes place at Uncle Mark's Farm, where Yorkshire terriers have a special role:
    * They protect chickens and turkeys from various threats
    * The farm has numerous chickens and a few turkeys

  Antagonists:
  - Primary: A sorcerer living in the woods who tries to steal chickens and eggs
    * Has evil squirrels as henchmen
  - Secondary: Mice and moles that try to steal food and damage crops

  Key Characters:
  - Uncle Mark: The owner of the farm
  - Yorkshire Terriers:
    * If protagonist is male (like Pawel): Brave and impulsive, often acts without thinking
    * If protagonist is female (like Pawleen): Intelligent and sweet, thinks before acting

  Requirements:
  - Story should be between 3,000-5,000 words
  - Include multiple chapters
  - Emphasize the farm's animal environment and the protective role of the terriers
  - Use descriptive, engaging language suitable for a visual novel
  - Use Gen Z slang and references to make the story relatable and fun

  Provide the response as a JSON object with:
  - title: story title
  - content: full story text with chapter breaks
  - metadata: containing wordCount, number of chapters, overall tone, and protagonist details
    * protagonist should include name, gender, and personality traits`;

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: "You are a creative children's book author specializing in Yorkshire terrier adventures with a Gen Z twist. You excel at creating stories about brave Yorkies protecting farm animals and dealing with magical threats."
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
          content: `You are a Yorkshire terrier expert and creative character designer. 
You excel at:
- Understanding Yorkie breed characteristics: tiny but brave, intelligent, energetic, and affectionate
- Creating unique personalities that match their appearance
- Spotting distinctive features like coat texture, facial expressions, and body language
- Generating Gen Z style names that match their personality

Always consider these Yorkie traits:
- Small size (usually 4-7 pounds) but confident demeanor
- Silky coat that can be black and tan, blue and tan, or parti-colored
- Alert expression with bright eyes and perked ears
- Spirited and feisty personality despite their tiny size`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this Yorkshire terrier and create a character profile with:
1. A creative, Gen Z style name that matches their appearance
2. Key personality traits focusing on their unique Yorkie characteristics
3. A vivid physical description highlighting their distinctive features

Format your response as JSON with these fields:
- name: A playful, modern name (e.g., "Pixel", "Chai", "Glitch")
- personality: 2-3 sentences about their character traits
- description: 2-3 sentences about their physical appearance

Remember to highlight their brave and spunky nature despite their small size!`
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