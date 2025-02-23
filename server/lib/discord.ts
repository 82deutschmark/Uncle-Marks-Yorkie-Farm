import { log } from "./logger";
import { DiscordError } from "./errors";
import type { MidJourneyPrompt } from "@shared/schema";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { storage } from "../storage";

// Initialize Discord bot client with minimal required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,          // Required for basic server interaction
    GatewayIntentBits.GuildMessages,   // Required for sending/receiving messages
  ]
});

let isConnected = false;

// Handle bot authentication
client.once('ready', () => {
  isConnected = true;
  log.info('Discord bot is ready!', {
    username: client.user?.tag,
    guilds: client.guilds.cache.size
  });
});

client.on('error', (error) => {
  isConnected = false;
  log.error('Discord bot error:', error);
});

// Start bot if token is available
const botToken = process.env.DISCORD_BOT_TOKEN;
if (!botToken) {
  log.error('Discord bot token is missing');
} else {
  client.login(botToken).catch((error) => {
    log.error('Failed to login to Discord:', error);
  });
}

async function constructInteractionPayload(prompt: string) {
  const channelId = process.env.DISCORD_CHANNEL_ID;
  const guildId = process.env.DISCORD_GUILD_ID;
  const midjourneyAppId = process.env.MIDJOURNEY_APP_ID;

  if (!channelId || !guildId || !midjourneyAppId) {
    throw new DiscordError('Missing required Discord configuration', 500, false);
  }

  // Construct the interaction payload as per Discord's API requirements
  return {
    type: 2, // APPLICATION_COMMAND type
    application_id: midjourneyAppId,
    guild_id: guildId,
    channel_id: channelId,
    session_id: `${Date.now()}`, // Unique session ID
    data: {
      version: '1118961510123847772', // Midjourney command version
      id: '938956540159881230', // Midjourney /imagine command ID
      name: "imagine",
      type: 1, // CHAT_INPUT type
      options: [
        {
          type: 3, // STRING type
          name: "prompt",
          value: prompt
        }
      ]
    }
  };
}

export async function sendMidJourneyPrompt(prompt: MidJourneyPrompt): Promise<void> {
  try {
    log.info('Starting MidJourney prompt generation', { prompt });

    // Check bot connection status
    if (!isConnected || !client.isReady()) {
      throw new DiscordError(
        'Discord bot is not connected. Please wait a moment and try again.',
        503,
        true
      );
    }

    // Format the prompt with required elements
    const basePrompt = `${prompt.protagonist.appearance} Yorkshire Terrier with ${prompt.protagonist.personality} personality, ${prompt.artStyle.style} art style with ${prompt.artStyle.description} elements, "Uncle Mark's Yorkie Farm" --s 550 --p --c 50 --w 1000`;

    // Construct the interaction payload
    const payload = await constructInteractionPayload(basePrompt);

    // Send the interaction to Discord's API
    const response = await fetch('https://discord.com/api/v10/interactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      log.error('Discord API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new DiscordError(
        `Failed to send interaction: ${response.statusText}`,
        response.status,
        response.status === 429 // Retry on rate limit
      );
    }

    log.info('Successfully sent MidJourney prompt through Discord API', {
      prompt: basePrompt,
      payload
    });
  } catch (error) {
    log.error('Failed to send prompt:', error);

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

// Handle incoming messages from MidJourney bot
client.on('messageCreate', async (message) => {
  // Only process messages from MidJourney bot
  if (message.author.id !== process.env.MIDJOURNEY_BOT_ID) return;

  log.info('Received message from MidJourney bot:', {
    content: message.content,
    hasAttachments: message.attachments.size > 0
  });

  // Process any image attachments
  const attachments = Array.from(message.attachments.values());
  for (const attachment of attachments) {
    if (attachment.contentType?.startsWith('image/')) {
      try {
        // Save the image URL to your storage
        await storage.createImage({
          bookId: 1, // Default book ID
          path: attachment.url,
          order: 0,
          selected: false,
          analyzed: false,
          midjourney: {
            status: 'completed',
            imageUrl: attachment.url
          }
        });

        log.info('Successfully saved MidJourney image:', {
          url: attachment.url,
          size: attachment.size
        });
      } catch (error) {
        log.error('Failed to save MidJourney image:', error);
      }
    }
  }
});