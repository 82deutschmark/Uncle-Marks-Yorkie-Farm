import { log } from "./logger";
import { DiscordError } from "./errors";

interface MidJourneyPrompt {
  description: string;
  characteristics?: string[];
  setting?: string;
}

export async function sendMidJourneyPrompt(prompt: MidJourneyPrompt): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new DiscordError('Discord webhook URL not configured', 500, false);
  }

  // Format the prompt with the signature
  const characteristics = prompt.characteristics?.join(', ') || '';
  const setting = prompt.setting ? ` in ${prompt.setting}` : '';
  const basePrompt = prompt.description || 'A cute Yorkshire Terrier';

  const formattedPrompt = `/imagine ${basePrompt}${characteristics ? `, ${characteristics}` : ''}${setting} --ar 1:1 --style raw --seed 1234 | Uncle Mark's Yorkie Farm`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: formattedPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Discord webhook error: ${errorText}`);
      throw new DiscordError(
        'Failed to send prompt to Discord',
        response.status,
        response.status === 429 || response.status >= 500
      );
    }

    log(`Successfully sent prompt to Discord: ${formattedPrompt}`);
  } catch (error) {
    if (error instanceof DiscordError) {
      throw error;
    }
    throw new DiscordError(
      `Failed to send prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      true
    );
  }
}