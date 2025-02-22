import { Client } from '@replit/object-storage';
import path from "path";
import { log } from "./logger";

class StorageClient {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      // Create a unique filename with timestamp
      const key = `uploads/${Date.now()}-${path.basename(filename)}`;

      // Upload the file
      await this.client.put(key, file);

      log('Successfully uploaded file:', key);
      return key;
    } catch (error) {
      log('Upload failed:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      const url = await this.client.getSignedUrl({
        key,
        expiresIn: 3600 // 1 hour
      });
      return url;
    } catch (error) {
      log('Failed to get file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }
}

export const storageClient = new StorageClient();