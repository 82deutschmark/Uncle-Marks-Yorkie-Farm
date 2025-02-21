import { Client } from "@replit/object-storage";
import { Image, InsertImage } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import { createHash } from "crypto";
import { log } from "./logger";

export class ImageStorage {
  private client: Client;
  private bucketId: string;

  constructor() {
    log('Initializing ImageStorage client');
    try {
      // Initialize with bucketId parameter (not bucket)
      this.bucketId = "story-images";
      this.client = new Client({
        bucketId: this.bucketId // Use bucketId instead of bucket
      });
      log('ImageStorage client initialized successfully');
    } catch (error) {
      log('Failed to initialize ImageStorage client', error);
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
        throw new Error('Only PNG images are supported');
      }

      const fileId = this.generateFileId(imageBuffer);
      const extension = path.extname(originalName);
      const key = `${fileId}${extension}`;

      log(`Uploading image with key: ${key}`);
      await this.client.putObject(key, imageBuffer);

      log(`Generating signed URL for key: ${key}`);
      const objectUrl = await this.client.getSignedUrl(key);

      return {
        fileId,
        objectUrl
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to upload image: ${message}`, error);
      throw new Error(`Failed to upload image: ${message}`);
    }
  }

  async deleteImage(fileId: string): Promise<void> {
    try {
      log(`Deleting image with fileId: ${fileId}`);
      await this.client.deleteObject(fileId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to delete image: ${message}`, error);
      throw new Error(`Failed to delete image: ${message}`);
    }
  }

  async getImageUrl(fileId: string): Promise<string> {
    try {
      log(`Getting signed URL for fileId: ${fileId}`);
      return await this.client.getSignedUrl(fileId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to get image URL: ${message}`, error);
      throw new Error(`Failed to get image URL: ${message}`);
    }
  }
}

export const imageStorage = new ImageStorage();