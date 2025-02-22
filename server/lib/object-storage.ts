import { Client } from '@replit/object-storage';
import { Image } from "@shared/schema";
import path from "path";
import { createHash } from "crypto";
import { log } from "./logger";

export class ImageStorage {
  private client: Client;

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

  async uploadImage(fileBuffer: Buffer, originalName: string): Promise<{ fileId: string; objectUrl: string }> {
    try {
      // Validate file is a zip
      const extension = path.extname(originalName).toLowerCase();
      if (extension !== '.zip') {
        throw new Error('Only ZIP files are supported for Yorkshire terrier story packages');
      }

      const fileId = this.generateFileId(fileBuffer);
      const key = `${fileId}${extension}`;

      // Create a new object in the bucket
      const obj = await this.client.createObject({
        key,
        data: fileBuffer,
        contentType: 'application/zip'
      });

      // Get a signed URL for the uploaded object
      const objectUrl = await this.client.getSignedUrl({
        key,
        expiresIn: 3600 * 24 * 7 // URL valid for 7 days
      });

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
      await this.client.deleteObject({ key: fileId });
      log(`Deleted file from Replit Object Storage: ${fileId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to delete file: ${message}`, error);
      throw new Error(`Failed to delete file: ${message}`);
    }
  }

  async getImageUrl(fileId: string): Promise<string> {
    try {
      return await this.client.getSignedUrl({
        key: fileId,
        expiresIn: 3600 * 24 // URL valid for 24 hours
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to get file URL: ${message}`, error);
      throw new Error(`Failed to get file URL: ${message}`);
    }
  }
}

export const imageStorage = new ImageStorage();