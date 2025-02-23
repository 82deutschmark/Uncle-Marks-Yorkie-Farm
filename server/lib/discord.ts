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

export async function sendMidJourneyPrompt(prompt: MidJourneyPrompt): Promise<{status: string, imageIds: number[]}> {
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_CHANNEL_ID || !process.env.DISCORD_GUILD_ID) {
    throw new DiscordError('Discord configuration missing. Please check environment variables.', 500, false);
  }

  try {
    const validatedPrompt = midjourneyPromptSchema.parse(prompt);
    log.info('Starting MidJourney prompt generation', { prompt: validatedPrompt });

    // Check bot connection status
    if (!isConnected || !client.isReady()) {
      throw new DiscordError(
        'Discord bot is not connected. Please wait a moment and try again.',
        503,
        true
      );
    }

    // Format the prompt with required elements
    const formattedPrompt = {
      protagonist: prompt.protagonist,
      artStyle: prompt.artStyle,
      description: prompt.description || `A Yorkshire Terrier ${prompt.protagonist.appearance} with ${prompt.protagonist.personality} personality`
    };

    try {
      // Use Puppeteer to automate Discord interaction
      const result = await sendMidJourneyPromptViaPuppeteer(formattedPrompt);
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

import { Client, GatewayIntentBits } from 'discord.js';

// Configure Discord client with required intents
client.on('ready', () => {
  log.info('Discord bot is ready!');
});

client.on('error', (error) => {
  log.error('Discord bot error:', error);
});

export async function findSimilarYorkieImage(description: string): Promise<{images: {url: string, id: string, timestamp: number}[], count: number, source?: string}> {
  try {
    // First try Discord search
    try {
      if (!client.isReady()) {
        throw new Error('Discord client not ready');
      }

      const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID!);
      if (!channel || !channel.isTextBased()) {
        throw new DiscordError('Invalid channel configuration', 500, false);
      }

    const allImages = [];
    let lastMessageId = null;
    let hasMore = true;

    while (hasMore) {
      const options: any = { limit: 100 };
      if (lastMessageId) {
        options.before = lastMessageId;
      }

      const messages = await channel.messages.fetch(options);
      if (messages.size === 0) {
        hasMore = false;
        break;
      }

      const imageMessages = messages.filter(msg => msg.attachments.size > 0);
      const yorkieImages = imageMessages.map(msg => ({
        url: msg.attachments.first()?.url,
        id: msg.id,
        timestamp: msg.createdTimestamp
      })).filter(img => img.url);

      allImages.push(...yorkieImages);
      lastMessageId = messages.last()?.id;

      // Stop after collecting 500 images or if we got less than 100 messages
      if (allImages.length >= 500 || messages.size < 100) {
        hasMore = false;
      }
    }

    return {
      images: allImages,
      count: allImages.length,
      source: 'discord'
    };
    } catch (discordError) {
      // If Discord search fails, fall back to database
      const dbImages = await storage.listImages({ analyzed: true });
      if (dbImages.length === 0) {
        throw new DiscordError(`No images found in Discord or database`, 500, false);
      }
      // Randomly select 3 images from the database
      const shuffled = dbImages.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      return {
        images: selected.map(img => ({
          url: img.path,
          id: img.id.toString(),
          timestamp: img.createdAt?.getTime() || Date.now()
        })),
        count: selected.length,
        source: 'database'
      };
    }
  } catch (error) {
    throw new DiscordError(`Failed to search images: ${error instanceof Error ? error.message : 'Unknown error'}`, 500, false);
  }
}
export async function findSimilarYorkieImage2(description: string) {
  try {
    // First try Discord search
    try {
      const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID!);
      if (!channel || !channel.isTextBased()) {
        throw new DiscordError('Invalid channel configuration', 500, false);
      }

    const allImages = [];
    let lastMessageId = null;
    let hasMore = true;

    while (hasMore) {
      const options: any = { limit: 100 };
      if (lastMessageId) {
        options.before = lastMessageId;
      }

      const messages = await channel.messages.fetch(options);
      if (messages.size === 0) {
        hasMore = false;
        break;
      }

      const imageMessages = messages.filter(msg => msg.attachments.size > 0);
      const yorkieImages = imageMessages.map(msg => ({
        url: msg.attachments.first()?.url,
        id: msg.id,
        timestamp: msg.createdTimestamp
      })).filter(img => img.url);

      allImages.push(...yorkieImages);
      lastMessageId = messages.last()?.id;

      // Stop after collecting 500 images or if we got less than 100 messages
      if (allImages.length >= 500 || messages.size < 100) {
        hasMore = false;
      }
    }

    return {
      images: allImages,
      count: allImages.length,
      source: 'discord'
    };
    } catch (discordError) {
      // If Discord search fails, fall back to database
      const dbImages = await storage.listImages({ analyzed: true });
      if (dbImages.length === 0) {
        throw new DiscordError(`No images found in Discord or database`, 500, false);
      }
      // Randomly select 3 images from the database
      const shuffled = dbImages.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      return {
        images: selected.map(img => ({
          url: img.path,
          id: img.id.toString(),
          timestamp: img.createdAt?.getTime() || Date.now()
        })),
        count: selected.length,
        source: 'database'
      };
    }
  } catch (error) {
    throw new DiscordError(`Failed to search images: ${error instanceof Error ? error.message : 'Unknown error'}`, 500, false);
  }
}