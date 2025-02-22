import OpenAI from "openai";
import { z } from "zod";
import { CharacterProfile, characterProfileSchema } from "@shared/schema";
import { OpenAIError } from "./errors";
import { log } from "./logger";

const openai = new OpenAI();

function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await fn();
        return resolve(result);
      } catch (error: any) {
        if (i === maxRetries - 1) {
          return reject(error);
        }
        console.error(`Attempt ${i + 1} failed:`, error);
        await new Promise(res => setTimeout(res, 1000 * (i + 1)));
      }
    }
  });
}

export async function analyzeImage(base64Image: string): Promise<CharacterProfile> {
  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing Yorkshire Terrier images and creating character profiles for stories. 
          Analyze the image and create a character profile with these attributes:
          - name: A cute, memorable name for the Yorkie
          - personality: Their dominant personality trait (playful, serious, curious, etc.)
          - quirk: A unique habit or characteristic
          - backstory: A brief, imaginative background (1-2 sentences)

          Respond with JSON matching this schema:
          ${characterProfileSchema}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this Yorkshire Terrier and create a character profile for our story."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content);
    return characterProfileSchema.parse(result);
  });
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
  - The story takes place at Uncle Mark's magical Yorkie farm, where Yorkies develop special abilities
  - Use Gen Z slang and references to make the story relatable and fun
  - Yorkshire terriers have a natural rivalry with squirrels and other rodents
  - Highlight the Yorkie's brave and spunky personality despite their small size

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
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are a creative children's book author specializing in Yorkshire terrier adventures with a Gen Z twist. You understand their unique traits: intelligence, bravery, and loyalty. Your stories capture their distinctive personalities and small but mighty spirit."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 4096
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new OpenAIError("No content received from OpenAI");
    }

    return JSON.parse(content) as StoryResponse;
  });
}