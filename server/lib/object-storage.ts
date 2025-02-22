import { Client } from '@replit/object-storage';
import { Image } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import { createHash } from "crypto";
import { log } from "./logger";

export class ImageStorage {
  private client;

  constructor() {
    log('Initializing ImageStorage');
    try {
      this.client = new Client();
      log('ImageStorage initialized with Replit Object Storage');
    } catch (error) {
      log('Failed to initialize Replit Object Storage', error);
      throw new Error('Failed to initialize storage client');
    }
  }

  private generateFileId(buffer: Buffer): string {
    return createHash('sha256')
      .update(buffer)
      .digest('hex')
      .substring(0, 16);
  }

  async uploadImage(imageBuffer: Buffer, originalName: string): Promise<{ fileId: string; objectUrl: string }> {
    try {
      // Validate and process image
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      if (metadata.format !== 'png') {
        throw new Error('Only PNG images are supported for Yorkshire terrier story illustrations');
      }

      const fileId = this.generateFileId(imageBuffer);
      const extension = path.extname(originalName);
      const key = `${fileId}${extension}`;

      // Upload to Replit Object Storage
      log(`Uploading image to Replit Object Storage with key: ${key}`);
      await this.client.put(
        key,
        imageBuffer,
        { access: 'public-read', contentType: 'image/png' }
      );

      // Get the URL for the uploaded object
      const objectUrl = await this.client.getPublicUrl(key);

      log(`Successfully uploaded image, URL: ${objectUrl}`);
      return { fileId, objectUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to upload image: ${message}`, error);
      throw new Error(`Failed to upload image: ${message}`);
    }
  }

  async deleteImage(fileId: string): Promise<void> {
    try {
      await this.client.delete(fileId);
      log(`Deleted image from Replit Object Storage: ${fileId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to delete image: ${message}`, error);
      throw new Error(`Failed to delete image: ${message}`);
    }
  }

  async getImageUrl(fileId: string): Promise<string> {
    try {
      return await this.client.getPublicUrl(fileId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to get image URL: ${message}`, error);
      throw new Error(`Failed to get image URL: ${message}`);
    }
  }
}

export const imageStorage = new ImageStorage();