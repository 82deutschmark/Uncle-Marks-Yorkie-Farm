import { Client } from '@replit/object-storage';
import { log } from "./logger";

class StorageClient {
  private client: Client;
  private bucketId: string;

  constructor() {
    // Initialize with the bucket ID from .replit file
    this.bucketId = 'replit-objstore-765db3a9-41bc-454b-9e99-f55145d9ea3a';
    this.client = new Client();
    log('Storage client initialized with bucket:', this.bucketId);
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      const key = `uploads/${Date.now()}-${filename}`;
      log('Starting upload for key:', key);

      // Get the bucket first
      const bucket = await this.client.bucket(this.bucketId);
      log('Got bucket reference');

      // Upload using bucket's upload method
      await bucket.upload(key, file);
      log('File upload completed successfully');

      return key;
    } catch (error) {
      log('Upload failed with error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      log('Getting signed URL for key:', key);

      // Get the bucket first
      const bucket = await this.client.bucket(this.bucketId);
      log('Got bucket reference for URL generation');

      // Get a signed URL that expires in 1 hour
      const url = await bucket.getSignedUrl(key, 3600);
      log('Generated signed URL successfully');

      return url;
    } catch (error) {
      log('Failed to get file URL:', error);
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const storageClient = new StorageClient();