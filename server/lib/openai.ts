import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  const prompt = `Create a charming Yorkshire terrier story with these parameters:
  - Yorkshire Terrier: A ${params.colors} Yorkie with these traits: ${params.characteristics}
  - Setting: ${params.setting}
  - Theme: ${params.theme}
  - Antagonist: ${params.antagonist}

  Story Context:
  - Yorkshire terriers have a natural rivalry with squirrels and other rodents
  - Squirrels are known for teasing and being mean to Yorkshire terriers
  - If the setting is Uncle Mark's magical farm, include its special enchanted elements
  - The story should showcase the Yorkshire terrier's bravery in facing the antagonist

  Requirements:
  - Story should be between 3,000-5,000 words
  - Include multiple chapters
  - Use descriptive, engaging language suitable for a visual novel
  - Create a whimsical, adventurous tone
  - Focus on the Yorkshire terrier's unique characteristics: brave, energetic, and clever
  - Include details about the antagonist's mischievous nature
  - If set on Uncle Mark's farm, weave in magical elements unique to the setting

  Provide the response as a JSON object with:
  - title: story title
  - content: full story text with chapter breaks
  - metadata: containing wordCount, number of chapters, and overall tone`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a creative children's book author specializing in Yorkshire terrier adventures. You understand their unique traits: intelligence, bravery, and loyalty. Your stories capture their distinctive personalities and small but mighty spirit. You also know that Yorkshire terriers have a special rivalry with squirrels and other rodents, who often tease them despite the Yorkies' brave nature."
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
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content) as StoryResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate Yorkshire terrier story: ${error.message}`);
    }
    throw new Error('Failed to generate Yorkshire terrier story: Unknown error occurred');
  }
}

export async function analyzeImage(base64Image: string): Promise<CharacterProfile> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Yorkshire terrier expert and creative character designer. You specialize in bringing out the unique personalities of Yorkies, highlighting their brave, intelligent, and affectionate nature while acknowledging their small size but big personalities."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Create a detailed character profile for the Yorkshire terrier in this image. Include a unique name that suits their appearance, specific personality traits that reflect true Yorkie characteristics, and a vivid description emphasizing their distinctive features (size, coat, expression, etc). Format the response as JSON with name, personality, and description fields."
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
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content) as CharacterProfile;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to analyze Yorkshire terrier image: ${error.message}`);
    }
    throw new Error('Failed to analyze Yorkshire terrier image: Unknown error occurred');
  }
}