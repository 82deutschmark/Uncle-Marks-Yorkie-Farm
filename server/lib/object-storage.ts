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

      // Use the correct method signature
      await this.client.createObject({
        key,
        data: file,
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
      // Use the correct method signature
      const url = await this.client.createPresignedUrl({
        key,
        expiresIn: 3600, // 1 hour
      });
      return url;
    } catch (error) {
      log('Failed to get file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }
}

export const storageClient = new StorageClient();