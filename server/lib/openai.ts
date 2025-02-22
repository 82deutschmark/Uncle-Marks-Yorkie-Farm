import OpenAI from "openai";

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
  // Use default Gen Z tone and setting if not provided
  const setting = params.setting || "Uncle Mark's magical Yorkie farm";
  const tone = "Gen Z";

  const prompt = `Create a charming Yorkshire terrier story with these parameters:
  - Yorkshire Terrier: A ${params.colors} Yorkie with these traits: ${params.characteristics}
  - Setting: ${setting}
  - Theme: ${params.theme}
  - Tone: ${tone}
  - Antagonist: ${params.antagonist}

  Story Context:
  - The story takes place at Uncle Mark's magical Yorkie farm, where he lives with his two beloved Yorkies, Pawel and Pawleen
  - Pawel and Pawleen are the friendly guides who help new Yorkies adjust to life on the farm
  - The farm has magical properties that enhance the Yorkies' natural talents
  - Use Gen Z slang and references to make the story relatable and fun
  - Yorkshire terriers have a natural rivalry with squirrels and other rodents
  - Squirrels are known for teasing and being mean to Yorkshire terriers

  Requirements:
  - Story should be between 3,000-5,000 words
  - Include multiple chapters
  - Use descriptive, engaging language suitable for a visual novel
  - Create a whimsical, adventurous tone with Gen Z flair
  - Focus on the Yorkshire terrier's unique characteristics: brave, energetic, and clever
  - Include details about the antagonist's mischievous nature
  - Weave in magical elements unique to Uncle Mark's farm

  Provide the response as a JSON object with:
  - title: story title
  - content: full story text with chapter breaks
  - metadata: containing wordCount, number of chapters, and overall tone`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a creative children's book author specializing in Yorkshire terrier adventures with a Gen Z twist. You understand their unique traits: intelligence, bravery, and loyalty. Your stories capture their distinctive personalities and small but mighty spirit, while incorporating modern Gen Z humor and references."
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
      model: "gpt-4-vision-preview-1106",
      messages: [
        {
          role: "system",
          content: "You are a Yorkshire terrier expert and creative character designer with a Gen Z flair. You specialize in bringing out the unique personalities of Yorkies, highlighting their brave, intelligent, and affectionate nature while acknowledging their small size but big personalities."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Create a detailed character profile for the Yorkshire terrier in this image. Include a unique Gen Z style name that suits their appearance, specific personality traits that reflect true Yorkie characteristics, and a vivid description emphasizing their distinctive features (size, coat, expression, etc). Format the response as JSON with name, personality, and description fields."
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