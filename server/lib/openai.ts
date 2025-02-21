import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface StoryParams {
  protagonist: string;
  setting: string;
  theme: string;
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
  const prompt = `Create a whimsical children's story with these parameters:
  - Protagonist: ${params.protagonist} (an animal character)
  - Setting: ${params.setting}
  - Theme: ${params.theme}

  Requirements:
  - Story should be at least 10,000 words
  - Include multiple chapters
  - Use descriptive, engaging language suitable for a visual novel
  - Create a whimsical, adventurous tone

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
          content: "You are a creative children's book author specializing in animal adventures."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content) as StoryResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate story: ${error.message}`);
    }
    throw new Error('Failed to generate story: Unknown error occurred');
  }
}

export async function analyzeImage(base64Image: string): Promise<CharacterProfile> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a creative character designer specializing in creating whimsical animal characters for children's stories."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Create a detailed character profile for the Yorkshire Terrier in this image. Include a unique name, personality traits, and a vivid description. Format the response as JSON with name, personality, and description fields."
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
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
    throw new Error('Failed to analyze image: Unknown error occurred');
  }
}