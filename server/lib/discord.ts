import { log } from "./logger";
import { DiscordError } from "./errors";
import type { MidJourneyPrompt } from "@shared/schema";
import { Client, GatewayIntentBits } from "discord.js";
import { storage } from "../storage";
import crypto from 'crypto';
import { sendMidJourneyPromptViaPuppeteer } from './discord-automation';

// Initialize Discord bot client with minimal required intents
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const botToken = process.env.DISCORD_BOT_TOKEN;
let isConnected = false;

// Handle bot authentication
client.once('ready', () => {
  isConnected = true;
  log.info('Discord bot is ready!');
});

client.on('disconnect', () => {
  isConnected = false;
  log.warn('Discord bot disconnected');
});

client.on('error', (error) => {
  isConnected = false;
  log.error('Discord bot error:', error);
});


// Start bot if token is available
if (!botToken) {
  log.error('Discord bot token is missing');
} else {
  client.login(botToken)
  .then(() => {
    log.info('Successfully logged in to Discord.');
  })
  .catch((error) => {
    log.error('Failed to login to Discord:', error);
  });
}

async function constructInteractionPayload(prompt: string) {
  const channelId = process.env.DISCORD_CHANNEL_ID;
  const guildId = process.env.DISCORD_GUILD_ID;
  const midjourneyAppId = "936929561302675456"; // Hardcoded Midjourney application ID

  if (!channelId || !guildId) {
    throw new DiscordError('Missing required Discord configuration', 500, false);
  }

  // Generate a random nonce for the interaction
  const nonce = crypto.randomBytes(8).toString('hex');

  return {
    type: 2,
    application_id: midjourneyAppId,
    guild_id: guildId,
    channel_id: channelId,
    session_id: crypto.randomBytes(16).toString('hex'),
    data: {
      version: "1237876415471554623",
      id: "938956540159881230",
      name: "imagine",
      type: 1,
      options: [{
        type: 3,
        name: "prompt",
        value: prompt
      }],
      application_command: {
        id: "938956540159881230",
        type: 1,
        application_id: midjourneyAppId,
        version: "1237876415471554623",
        name: "imagine",
        description: "Create images with Midjourney",
        options: [{
          type: 3,
          name: "prompt",
          description: "The prompt to imagine",
          required: true,
          description_localized: "The prompt to imagine",
          name_localized: "prompt"
        }],
        dm_permission: true,
        contexts: [0, 1, 2],
        integration_types: [0, 1],
        global_popularity_rank: 1,
        description_localized: "Create images with Midjourney",
        name_localized: "imagine"
      },
      attachments: []
    },
    nonce: nonce,
    analytics_location: "slash_ui"
  };
}

export async function sendMidJourneyPrompt(prompt: MidJourneyPrompt): Promise<void> {
  if (!process.env.DISCORD_USER_TOKEN || !process.env.DISCORD_CHANNEL_ID) {
    throw new Error('Discord configuration missing. Please check environment variables.');
  }
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
    const basePrompt = `${prompt.protagonist.appearance} Yorkshire Terrier with ${prompt.protagonist.personality} personality, ${prompt.artStyle.style} art style with ${prompt.artStyle.description} elements`;

    try {
      // Use Puppeteer to automate Discord interaction
      const result = await sendMidJourneyPromptViaPuppeteer(basePrompt);
      if (!result) {
        throw new DiscordError('No response from Discord integration', 500, true);
      }
      log.info('Successfully sent MidJourney prompt through Puppeteer');
      return { status: 'success', imageIds: [result.id || 1] };
    } catch (error) {
      log.error('Failed to send prompt via Puppeteer:', error);
      throw new DiscordError(
        error instanceof Error ? error.message : 'Failed to send prompt to Discord',
        500,
        true
      );
    }
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