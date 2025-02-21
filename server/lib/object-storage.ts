import { Client } from "@replit/object-storage";
import { Image, InsertImage, type images } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import { createHash } from "crypto";
import { log } from "./vite";

interface ObjectStorageClient extends Client {
  putObject(bucket: string, key: string, data: Buffer): Promise<void>;
  getSignedUrl(bucket: string, key: string): Promise<string>;
  deleteObject(bucket: string, key: string): Promise<void>;
}

export class ImageStorage {
  private client: ObjectStorageClient;
  private bucketName = "story-images";

  constructor() {
    log('Initializing ImageStorage client');
    this.client = new Client({}) as ObjectStorageClient;
    this.initializeBucket().catch(error => {
      log(`Error initializing bucket: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  private async initializeBucket(): Promise<void> {
    try {
      const buckets = await this.client.listBuckets();
      if (!buckets.includes(this.bucketName)) {
        await this.client.createBucket(this.bucketName);
      }
    } catch (error) {
      log('Failed to initialize bucket:', error);
      // Don't throw here as it might be a transient error
      // The bucket operations will fail later if there's a real problem
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

      // Upload using putObject
      log(`Uploading image with key: ${key}`);
      await this.client.putObject(this.bucketName, key, imageBuffer);

      // Get a signed URL that expires in 7 days
      log(`Generating signed URL for key: ${key}`);
      const objectUrl = await this.client.getSignedUrl(this.bucketName, key);

      return {
        fileId,
        objectUrl
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to upload image: ${message}`);
      throw new Error(`Failed to upload image: ${message}`);
    }
  }

  async deleteImage(fileId: string): Promise<void> {
    try {
      log(`Deleting image with fileId: ${fileId}`);
      await this.client.deleteObject(this.bucketName, fileId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to delete image: ${message}`);
      throw new Error(`Failed to delete image: ${message}`);
    }
  }

  async getImageUrl(fileId: string): Promise<string> {
    try {
      log(`Getting signed URL for fileId: ${fileId}`);
      return await this.client.getSignedUrl(this.bucketName, fileId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to get image URL: ${message}`);
      throw new Error(`Failed to get image URL: ${message}`);
    }
  }
}

export const imageStorage = new ImageStorage();