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

interface CharacterProfile {
  name: string;
  personality: string;
  description: string;
}

export async function generateStory(params: StoryParams): Promise<StoryResponse> {
  const prompt = `## General Setting
• Setting: Uncle Mark's Farm  
• Environment:
 – Numerous chickens  
 – A few turkeys  
• Role of Yorkshire terriers:
 – Protect the chickens and turkeys from threats

## Plot Elements & Threats
• Primary antagonist: A sorcerer living in the woods  
 – Objective: Steal chickens and eggs  
 – Henchmen: Evil squirrels  
• Secondary nuisances:
 – Mice and moles that try to steal food and damage crops

## Key Characters
• Uncle Mark – The owner of the farm
• Existing Farm Yorkies:
 – Pawel: A brave and impulsive male Yorkie who acts without thinking
 – Pawleen: An intelligent and sweet female Yorkie who thinks before acting
• Protagonist: A ${params.colors} Yorkshire Terrier with these traits: ${params.characteristics}
  – Role: ${params.theme || 'Protecting the Farm'}

## Additional Story Parameters
• Theme: ${params.theme}
• Writing Style: Use Gen Z language and references
• Length: 3,000-5,000 words
• Format: Multiple chapters with clear breaks

## Required Story Elements
• Emphasize the farm's animal environment
• Highlight the protective role of the terriers
• Include both the sorcerer and his squirrel henchmen as main antagonists
• Reference the threat from mice and moles
• Include interactions with Pawel and Pawleen as mentor figures or friends

Provide the response as a JSON object with:
- title: story title
- content: full story text with chapter breaks
- metadata: containing wordCount, number of chapters, overall tone, and protagonist details
  * protagonist should include name and personality traits`;

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: "You are a creative children's book author specializing in Yorkshire terrier adventures set at Uncle Mark's Farm. You excel at creating stories about brave Yorkies protecting farm animals from magical threats, with Pawel and Pawleen as supporting characters who help guide new Yorkies in their adventures."
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
-creative interactive, storytelling 

- Generating Gen Z style names that match their personality

Always consider these Yorkie traits:
- Small size but confident demeanor
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
- name: A playful, modern name 
- personality: 2-3 sentences about their character traits
- description: 2-3 sentences about their physical appearance

Remember to be creative `
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