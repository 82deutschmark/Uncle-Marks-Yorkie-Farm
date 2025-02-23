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

  storage.addDebugLog("midjourney", "response", {
    event: "ready",
    status: "Bot successfully connected",
    botUsername: client.user?.tag
  }).catch(console.error);
});

client.on('error', (error) => {
  isConnected = false;
  log.error('Discord bot error:', error);
  storage.addDebugLog("midjourney", "error", {
    event: "client_error",
    error: error.message,
    stack: error.stack
  }).catch(console.error);
});

// Start bot if token is available
const botToken = process.env.DISCORD_BOT_TOKEN;
if (!botToken) {
  log.error('Discord bot token is missing');
  storage.addDebugLog("midjourney", "error", {
    event: "missing_token",
    error: "DISCORD_BOT_TOKEN is not configured"
  }).catch(console.error);
} else {
  client.login(botToken).catch((error) => {
    log.error('Failed to login to Discord:', error);
    storage.addDebugLog("midjourney", "error", {
      event: "login_failed",
      error: error.message,
      stack: error.stack
    }).catch(console.error);
  });
}

export async function sendMidJourneyPrompt(prompt: MidJourneyPrompt): Promise<void> {
  try {
    await storage.addDebugLog("midjourney", "request", {
      event: "send_prompt",
      prompt,
      botStatus: {
        connected: isConnected,
        username: client.user?.tag
      }
    });

    // Check bot connection status
    if (!isConnected || !client.isReady()) {
      throw new DiscordError(
        'Discord bot is not connected. Please wait a moment and try again.',
        503,
        true
      );
    }

    // Format the prompt with art style and description
    const basePrompt = prompt.description || 
      `A Yorkshire Terrier ${prompt.protagonist.appearance}. The Yorkie has ${prompt.protagonist.personality} personality.`;

    const artStyle = prompt.artStyle ? ` --style ${prompt.artStyle.style}` : '';
    const formattedPrompt = `/imagine ${basePrompt}${artStyle} --ar 1:1 --q 2 --v 5.2`;

    // Find the designated channel
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (!channelId) {
      throw new DiscordError('Discord channel ID not configured', 500, false);
    }

    let channel;
    try {
      channel = await client.channels.fetch(channelId);
    } catch (error) {
      log.error('Failed to fetch Discord channel:', error);
      throw new DiscordError(
        'Failed to access Discord channel. Please verify channel permissions.',
        500,
        true
      );
    }

    if (!channel || !(channel instanceof TextChannel)) {
      throw new DiscordError('Invalid Discord channel or not a text channel', 500, false);
    }

    // Send the prompt
    await channel.send(formattedPrompt);

    await storage.addDebugLog("midjourney", "response", {
      event: "prompt_sent",
      channel: channelId,
      prompt: formattedPrompt,
      timestamp: new Date().toISOString()
    });

    log.info('Successfully sent prompt through bot:', {
      prompt: formattedPrompt,
      channel: channelId,
      botUsername: client.user?.tag
    });
  } catch (error) {
    await storage.addDebugLog("midjourney", "error", {
      event: "send_prompt_failed",
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      prompt,
      botStatus: {
        connected: isConnected,
        username: client.user?.tag
      }
    });

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

// Update the message handler to use Array.from() for proper iteration
client.on('messageCreate', async (message) => {
  // Only process messages from MidJourney bot
  if (message.author.id !== process.env.MIDJOURNEY_BOT_ID) return;

  log.info('Received message from MidJourney bot:', {
    content: message.content,
    hasAttachments: message.attachments.size > 0
  });

  // Log the response for debugging
  await storage.addDebugLog("midjourney", "response", {
    event: "message_received",
    content: message.content,
    attachments: Array.from(message.attachments.values()).map(a => ({
      url: a.url,
      contentType: a.contentType,
      size: a.size
    })),
    timestamp: new Date().toISOString()
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