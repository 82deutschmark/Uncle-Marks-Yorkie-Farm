
import puppeteer from 'puppeteer';
import { log } from './logger';

export async function sendMidJourneyPromptViaPuppeteer(prompt: string) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Login to Discord
    await page.goto('https://discord.com/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', process.env.DISCORD_EMAIL || '', { delay: 50 });
    await page.type('input[name="password"]', process.env.DISCORD_PASSWORD || '', { delay: 50 });
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    // Navigate to specific channel
    const channelUrl = `https://discord.com/channels/${process.env.DISCORD_GUILD_ID}/${process.env.DISCORD_CHANNEL_ID}`;
    await page.goto(channelUrl, { waitUntil: 'networkidle0' });

    // Send command
    await page.waitForSelector('[role="textbox"]');
    const textbox = await page.$('[role="textbox"]');
    if (!textbox) throw new Error('Could not find message input');
    
    await textbox.click();
    await page.keyboard.type(`/imagine prompt: ${prompt}`, { delay: 50 });
    await page.keyboard.press('Enter');

    // Wait for command to be sent
    await page.waitForTimeout(5000);

    log.info('Successfully sent MidJourney prompt via Puppeteer');
  } catch (error) {
    log.error('Failed to send prompt via Puppeteer:', error);
    throw error;
  } finally {
    await browser.close();
  }
}
