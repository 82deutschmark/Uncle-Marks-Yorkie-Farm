import { Client } from "@replit/object-storage";
import { Image, InsertImage } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import { createHash } from "crypto";
import { log } from "./logger";

export class ImageStorage {
  private client: Client;

  constructor() {
    log('Initializing ImageStorage');
    try {
      this.client = new Client({
        bucketId: "replit-objstore-765db3a9-41bc-454b-9e99-f55145d9ea3a"
      });
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
      await this.client.upload(key, imageBuffer);

      // Get the signed URL that will be valid for 7 days
      const objectUrl = await this.client.getSignedUrl(key, Date.now() + 7 * 24 * 60 * 60 * 1000);
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
      return await this.client.getSignedUrl(fileId, Date.now() + 7 * 24 * 60 * 60 * 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to get image URL: ${message}`, error);
      throw new Error(`Failed to get image URL: ${message}`);
    }
  }
}

export const imageStorage = new ImageStorage();