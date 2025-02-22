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
      const key = `uploads/${Date.now()}-${path.basename(filename)}`;

      await this.client.put(
        key,
        file
      );

      return key;
    } catch (error) {
      log('Upload failed:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      return await this.client.getSignedUrl({
        key,
        expiresIn: 3600 * 24 // 24 hours
      });
    } catch (error) {
      log('Failed to get file URL:', error);
      throw new Error('Failed to get file URL');
    }
  }
}

export const storageClient = new StorageClient();