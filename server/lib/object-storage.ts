import { Client } from '@replit/object-storage';
import { Image } from "@shared/schema";
import path from "path";
import { createHash } from "crypto";
import { log } from "./logger";

export class ImageStorage {
  private client: Client;
  private bucketId: string;

  constructor() {
    log('Initializing ImageStorage');
    try {
      // Use the bucket ID from .replit config
      this.bucketId = 'replit-objstore-765db3a9-41bc-454b-9e99-f55145d9ea3a';
      this.client = new Client({
        bucketId: this.bucketId
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

  async uploadImage(fileBuffer: Buffer, originalName: string): Promise<{ fileId: string; objectUrl: string }> {
    try {
      // Validate file is a zip
      const extension = path.extname(originalName).toLowerCase();
      if (extension !== '.zip') {
        throw new Error('Only ZIP files are supported for Yorkshire terrier story packages');
      }

      const fileId = this.generateFileId(fileBuffer);
      const key = `${fileId}${extension}`;

      // Upload to Replit Object Storage using the correct method
      log(`Uploading file to Replit Object Storage with key: ${key}`);
      await this.client.put(key, fileBuffer, {
        access: 'public', // Make the file publicly accessible
        contentType: 'application/zip'
      });

      // Get the URL for the uploaded object using the correct method
      const objectUrl = await this.client.getUrl(key);

      log(`Successfully uploaded file, URL: ${objectUrl}`);
      return { fileId, objectUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to upload file: ${message}`, error);
      throw new Error(`Failed to upload file: ${message}`);
    }
  }

  async deleteImage(fileId: string): Promise<void> {
    try {
      await this.client.delete(fileId);
      log(`Deleted file from Replit Object Storage: ${fileId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to delete file: ${message}`, error);
      throw new Error(`Failed to delete file: ${message}`);
    }
  }

  async getImageUrl(fileId: string): Promise<string> {
    try {
      return await this.client.getUrl(fileId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to get file URL: ${message}`, error);
      throw new Error(`Failed to get file URL: ${message}`);
    }
  }
}

export const imageStorage = new ImageStorage();