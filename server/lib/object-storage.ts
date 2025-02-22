import { Client } from '@replit/object-storage';
import { log } from "./logger";

class StorageClient {
  private client: Client;

  constructor() {
    this.client = new Client();
    log('Storage client initialized');
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      const key = `uploads/${Date.now()}-${filename}`;
      log('Attempting to upload file with key:', key);

      // Simple upload using the basic put method
      await this.client.write(key, file);
      log('File upload successful');

      return key;
    } catch (error) {
      log('Upload failed:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      log('Generating signed URL for key:', key);

      // Get a signed URL that expires in 1 hour
      const url = await this.client.createSignedUrl(key, 3600);
      log('URL generation successful');

      return url;
    } catch (error) {
      log('Failed to get file URL:', error);
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const storageClient = new StorageClient();