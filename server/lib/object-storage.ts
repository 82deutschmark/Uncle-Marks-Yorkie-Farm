import { Client } from "@replit/object-storage";
import { Image, InsertImage, type images } from "@shared/schema";
import sharp from "sharp";
import path from "path";
import { createHash } from "crypto";

// Define proper types for Replit Object Storage Client
interface ObjectStorageClient extends Client {
  listBuckets(): Promise<string[]>;
  createBucket(name: string): Promise<void>;
  putObject(bucket: string, key: string, data: Buffer): Promise<void>;
  getSignedUrl(bucket: string, key: string): Promise<string>;
  deleteObject(bucket: string, key: string): Promise<void>;
}

export class ImageStorage {
  private client: ObjectStorageClient;
  private bucketName = "story-images";

  constructor() {
    // Cast to our extended interface
    this.client = new Client() as ObjectStorageClient;
  }

  private async ensureBucket(): Promise<void> {
    try {
      const buckets = await this.client.listBuckets();
      if (!buckets.includes(this.bucketName)) {
        await this.client.createBucket(this.bucketName);
      }
    } catch (error) {
      throw new Error(`Failed to ensure bucket exists: ${error instanceof Error ? error.message : String(error)}`);
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
      await this.ensureBucket();

      // Validate and process image
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      if (metadata.format !== 'png') {
        throw new Error('Only PNG images are supported');
      }

      const fileId = this.generateFileId(imageBuffer);
      const extension = path.extname(originalName);
      const key = `${fileId}${extension}`;

      await this.client.putObject(this.bucketName, key, imageBuffer);
      const objectUrl = await this.client.getSignedUrl(this.bucketName, key);

      return {
        fileId,
        objectUrl
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteImage(fileId: string): Promise<void> {
    try {
      await this.client.deleteObject(this.bucketName, fileId);
    } catch (error) {
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getImageUrl(fileId: string): Promise<string> {
    try {
      return await this.client.getSignedUrl(this.bucketName, fileId);
    } catch (error) {
      throw new Error(`Failed to get image URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const imageStorage = new ImageStorage();