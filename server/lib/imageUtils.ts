
import * as fs from 'fs/promises';
import { log } from './logger';

/**
 * Reads an image file and returns it as a Base64 encoded string
 * @param imagePath Path to the image file
 * @returns Base64 encoded image with proper format prefix
 */
export async function getBase64Image(imagePath: string): Promise<string> {
  try {
    // Read the file as buffer
    const imageBuffer = await fs.readFile(imagePath);
    
    // Convert buffer to base64 string
    const base64String = imageBuffer.toString('base64');
    
    // Determine the MIME type based on file extension
    const extension = imagePath.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg'; // Default
    
    if (extension === 'png') {
      mimeType = 'image/png';
    } else if (extension === 'gif') {
      mimeType = 'image/gif';
    } else if (extension === 'svg') {
      mimeType = 'image/svg+xml';
    } else if (extension === 'webp') {
      mimeType = 'image/webp';
    }
    
    // Return base64 with data URI prefix
    return base64String;
  } catch (error) {
    log.error('Error encoding image to base64:', error);
    throw error;
  }
}
