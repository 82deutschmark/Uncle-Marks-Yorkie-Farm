import { log } from "./logger";
import { DiscordError } from "./errors";
import type { MidJourneyPrompt } from "@shared/schema";

export async function sendMidJourneyPrompt(prompt: MidJourneyPrompt): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new DiscordError('Discord webhook URL not configured', 500, false);
  }

  // Format the prompt with all components and signature
  const characteristics = prompt.characteristics?.join(', ') || '';
  const setting = prompt.setting ? ` in ${prompt.setting}` : '';
  const artStyle = prompt.artStyle ? ` --style ${prompt.artStyle.style}` : '';
  const basePrompt = prompt.description || 'A cute Yorkshire Terrier';

  const formattedPrompt = `/imagine ${basePrompt}${characteristics ? `, ${characteristics}` : ''}${setting}${artStyle} --ar 1:1 --seed 1234 | Uncle Mark's Yorkie Farm`;

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