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

      // Basic put operation using Replit's Object Storage
      await this.client.put(key, file);
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

      // Generate URL with 1 hour expiry
      const url = await this.client.signedUrl(key, { expires: 3600 });
      log('URL generation successful');

      return url;
    } catch (error) {
      log('Failed to get file URL:', error);
      throw new Error(`Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const storageClient = new StorageClient();