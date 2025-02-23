
import { log } from './logger';

const DISCORD_API_VERSION = '10';
const BASE_URL = `https://discord.com/api/v${DISCORD_API_VERSION}`;

export async function sendMidJourneyPromptViaPuppeteer(prompt: string) {
  try {
    const headers = {
      'Authorization': process.env.DISCORD_USER_TOKEN,
      'Content-Type': 'application/json'
    };

    const data = {
      type: 2,
      application_id: process.env.MIDJOURNEY_APP_ID,
      guild_id: process.env.DISCORD_GUILD_ID,
      channel_id: process.env.DISCORD_CHANNEL_ID,
      session_id: Math.random().toString(36).substring(2),
      data: {
        version: "1237876415471554623",
        id: "938956540159881230",
        name: "imagine",
        type: 1,
        options: [{ type: 3, name: "prompt", value: prompt }],
        application_command: {
          id: "938956540159881230",
          application_id: process.env.MIDJOURNEY_APP_ID,
          version: "1237876415471554623",
          default_permission: true,
          default_member_permissions: null,
          type: 1,
          name: "imagine",
          description: "Create images with Midjourney",
          dm_permission: true,
          options: [{
            type: 3,
            name: "prompt",
            description: "The prompt to imagine",
            required: true
          }]
        }
      }
    };

    const response = await fetch(`${BASE_URL}/interactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    log.info('Successfully sent MidJourney prompt via Discord API');
    return { id: Math.random().toString(36).substring(2) };
  } catch (error) {
    log.error('Failed to send prompt via Discord API:', error);
    throw error;
  }
}
