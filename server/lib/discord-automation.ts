// Discord automation removed - functionality replaced with database storage
import { log } from './logger';

export async function sendMidJourneyPromptViaPuppeteer() {
  log.info('Discord integration disabled - using database storage only');
  throw new Error('Discord integration has been disabled');
}