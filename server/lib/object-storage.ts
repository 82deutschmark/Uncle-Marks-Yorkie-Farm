import { Client } from "@replit/object-storage";
import { Image, InsertImage } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import { createHash } from "crypto";
import { log } from "./logger";

export class ImageStorage {
  private client: Client | null;
  private useMemoryFallback: boolean = true;
  private memoryStorage: Map<string, Buffer> = new Map();

  constructor() {
    log('Initializing ImageStorage');
    try {
      // Initialize with the bucket ID
      this.client = new Client({
        bucket: "replit-objstore-765db3a9-41bc-454b-9e99-f55145d9ea3a"
      });
      this.useMemoryFallback = false;
      log('ImageStorage initialized with Replit Object Storage');
    } catch (error) {
      this.client = null;
      log('Failed to initialize Replit Object Storage, using memory storage fallback', error);
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

      if (this.useMemoryFallback) {
        // Store in memory
        this.memoryStorage.set(key, imageBuffer);
        const objectUrl = `/api/images/memory/${key}`;
        log(`Stored image in memory with key: ${key}`);
        return { fileId, objectUrl };
      } else if (this.client) {
        // Store in Replit Object Storage
        log(`Uploading image to Replit Object Storage with key: ${key}`);
        await this.client.put(key, imageBuffer);
        const objectUrl = await this.client.getUrl(key);
        return { fileId, objectUrl };
      } else {
        throw new Error('No storage backend available');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to upload image: ${message}`, error);
      throw new Error(`Failed to upload image: ${message}`);
    }
  }

  async deleteImage(fileId: string): Promise<void> {
    try {
      if (this.useMemoryFallback) {
        this.memoryStorage.delete(fileId);
        log(`Deleted image from memory: ${fileId}`);
      } else if (this.client) {
        await this.client.delete(fileId);
        log(`Deleted image from Replit Object Storage: ${fileId}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to delete image: ${message}`, error);
      throw new Error(`Failed to delete image: ${message}`);
    }
  }

  async getImageUrl(fileId: string): Promise<string> {
    try {
      if (this.useMemoryFallback) {
        return `/api/images/memory/${fileId}`;
      } else if (this.client) {
        return await this.client.getUrl(fileId);
      }
      throw new Error('No storage backend available');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to get image URL: ${message}`, error);
      throw new Error(`Failed to get image URL: ${message}`);
    }
  }

  // Method to get image data from memory storage
  getMemoryImage(key: string): Buffer | undefined {
    return this.memoryStorage.get(key);
  }
}

export const imageStorage = new ImageStorage();