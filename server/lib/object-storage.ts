import { Client } from '@replit/object-storage';
import { log } from "./logger";

class StorageClient {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      const key = `uploads/${Date.now()}-${filename}`;

      // Use the raw put method
      await this.client.put({
        key,
        value: file,
      });

      log('Successfully uploaded file:', key);
      return key;
    } catch (error) {
      log('Upload failed:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      // Use the raw get method to verify file exists
      await this.client.get(key);

      // Generate a temporary URL
      const url = await this.client.getPresignedUrl(key, 3600); // 1 hour expiry
      return url;
    } catch (error) {
      log('Failed to get file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }
}

export const storageClient = new StorageClient();