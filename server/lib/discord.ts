import { log } from "./logger";
import { DiscordError } from "./errors";
import type { MidJourneyPrompt } from "@shared/schema";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { storage } from "../storage";

// Initialize Discord bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Handle bot authentication
client.once('ready', () => {
  log.info('Discord bot is ready!');
  storage.addDebugLog("midjourney", "response", {
    event: "ready",
    status: "Bot successfully connected"
  }).catch(console.error);
});

client.on('error', (error) => {
  log.error('Discord bot error:', error);
  storage.addDebugLog("midjourney", "error", {
    event: "client_error",
    error: error.message
  }).catch(console.error);
});

// Start bot if token is available
const botToken = process.env.DISCORD_BOT_TOKEN;
if (botToken) {
  client.login(botToken).catch((error) => {
    log.error('Failed to login to Discord:', error);
    storage.addDebugLog("midjourney", "error", {
      event: "login_failed",
      error: error.message
    }).catch(console.error);
  });
}

export async function sendMidJourneyPrompt(prompt: MidJourneyPrompt): Promise<void> {
  try {
    await storage.addDebugLog("midjourney", "request", {
      event: "send_prompt",
      prompt
    });

    // Format the prompt with all components and signature
    const characteristics = prompt.characteristics?.join(', ') || '';
    const setting = prompt.setting ? ` in ${prompt.setting}` : '';
    const artStyle = prompt.artStyle ? ` --style ${prompt.artStyle.style}` : '';
    const basePrompt = prompt.description;

    const formattedPrompt = `/imagine ${basePrompt}${characteristics ? `, ${characteristics}` : ''}${setting}${artStyle} --ar 1:1 --seed 1234 | Uncle Mark's Yorkie Farm`;

    // Check if bot is ready
    if (!client.isReady()) {
      throw new DiscordError(
        'Discord bot is not ready',
        503,
        true
      );
    }

    // Find the designated channel
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (!channelId) {
      throw new DiscordError('Discord channel ID not configured', 500, false);
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      throw new DiscordError('Invalid Discord channel or not a text channel', 500, false);
    }

    await channel.send(formattedPrompt);
    await storage.addDebugLog("midjourney", "response", {
      event: "prompt_sent",
      channel: channelId,
      prompt: formattedPrompt
    });

    log.info('Successfully sent prompt through bot:', formattedPrompt);
  } catch (error) {
    await storage.addDebugLog("midjourney", "error", {
      event: "send_prompt_failed",
      error: error instanceof Error ? error.message : 'Unknown error',
      prompt
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

// Listen for MidJourney responses
client.on('messageCreate', async (message) => {
  // Verify message is from MidJourney bot
  if (message.author.id !== process.env.MIDJOURNEY_BOT_ID) return;

  await storage.addDebugLog("midjourney", "response", {
    event: "message_received",
    content: message.content,
    attachments: message.attachments.map(a => a.url)
  });

  // TODO: Implement MidJourney response handling
  // This will be implemented in the next iteration after confirming
  // the basic Discord integration works
});