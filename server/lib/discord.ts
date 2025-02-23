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
   const formattedPrompt = `/imagine ${basePrompt}`;

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

   log.info('Successfully sent prompt through bot:', {
     prompt: formattedPrompt,
     channel: channelId,
     botUsername: client.user?.tag
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