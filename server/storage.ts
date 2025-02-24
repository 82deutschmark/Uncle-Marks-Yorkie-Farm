import { images, stories, type Image, type InsertImage, type Story, type InsertStory } from "@shared/schema";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "./db";
import * as fs from 'fs/promises';
import * as path from 'path';
import * as unzipper from 'unzipper';
import { log } from "./lib/logger";
import { customArtStyles, type CustomArtStyle, type InsertCustomArtStyle } from "@shared/schema";

interface DebugLog {
  timestamp: string;
  service: "openai" | "midjourney";
  type: "request" | "response" | "error";
  content: any;
}

export interface IStorage {
  createImage(image: InsertImage): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  listImages(options?: { analyzed?: boolean; selected?: boolean; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<Image[]>;
  getAllImages(): Promise<Image[]>;
  updateImageMetadata(id: number, metadata: Partial<InsertImage>): Promise<Image>;
  saveUploadedFile(file: Buffer, filename: string, bookId: number): Promise<Image[]>;
  deleteImage(id: number): Promise<void>;
  createStory(story: InsertStory): Promise<Story>;
  getStory(id: number): Promise<Story | undefined>;
  createCustomArtStyle(style: InsertCustomArtStyle): Promise<CustomArtStyle>;
  getCustomArtStyle(id: number): Promise<CustomArtStyle | undefined>;
  listCustomArtStyles(): Promise<CustomArtStyle[]>;
  updateCustomArtStyle(id: number, style: Partial<InsertCustomArtStyle>): Promise<CustomArtStyle>;
  getDebugLogs(): Promise<{ openai: DebugLog[], midjourney: DebugLog[] }>;
  addDebugLog(service: DebugLog["service"], type: DebugLog["type"], content: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private readonly uploadsDir: string;
  private debugLogs: {
    openai: DebugLog[];
    midjourney: DebugLog[];
  };

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.debugLogs = {
      openai: [],
      midjourney: []
    };
    fs.mkdir(this.uploadsDir, { recursive: true }).catch(err => log.error('Failed to create uploads directory:', err));
  }

  private getStoragePath(filename: string, bookId: number): string {
    return `book-${bookId}/${filename}`;
  }

  private getFullPath(storagePath: string): string {
    return path.join(this.uploadsDir, storagePath);
  }

  private getPublicUrl(storagePath: string): string {
    return `/uploads/${storagePath}`;
  }

  async createImage(image: InsertImage): Promise<Image> {
    try {
      const [newImage] = await db.insert(images)
        .values(image)
        .returning();

      return {
        ...newImage,
        path: this.getPublicUrl(newImage.path)
      };
    } catch (error) {
      log.error(`Failed to create image record: ${error}`);
      throw new Error(`Failed to create image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getImage(id: number): Promise<Image | undefined> {
    try {
      const [image] = await db.select().from(images).where(eq(images.id, id));
      if (!image) return undefined;

      return {
        ...image,
        path: this.getPublicUrl(image.path)
      };
    } catch (error) {
      log.error(`Failed to get image ${id}: ${error}`);
      throw new Error(`Failed to get image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listImages(options?: { analyzed?: boolean; selected?: boolean; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<Image[]> {
    try {
      let query = db.select().from(images);

      if (options?.analyzed !== undefined) {
        query = query.where(eq(images.analyzed, options.analyzed));
      }
      if (options?.selected !== undefined) {
        query = query.where(eq(images.selected, options.selected));
      }
      if (options?.sortBy) {
        const order = options.sortOrder === 'desc' ? desc : asc;
        query = query.orderBy(order(images[options.sortBy as keyof typeof images]));
      }

      const results = await query;
      return results.map(img => ({
        ...img,
        path: this.getPublicUrl(img.path)
      }));
    } catch (error) {
      log.error(`Failed to list images: ${error}`);
      throw new Error(`Failed to list images: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAllImages(): Promise<Image[]> {
    try {
      const results = await db.select().from(images);
      return results.map(img => ({
        ...img,
        path: this.getPublicUrl(img.path)
      }));
    } catch (error) {
      log.error(`Failed to get all images: ${error}`);
      throw new Error(`Failed to get all images: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateImageMetadata(id: number, metadata: Partial<InsertImage>): Promise<Image> {
    try {
      const [updatedImage] = await db.update(images)
        .set(metadata)
        .where(eq(images.id, id))
        .returning();

      return {
        ...updatedImage,
        path: this.getPublicUrl(updatedImage.path)
      };
    } catch (error) {
      log.error(`Failed to update image ${id} metadata: ${error}`);
      throw new Error(`Failed to update image metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async saveSingleImage(file: Buffer, filename: string, bookId: number): Promise<Image[]> {
    const storagePath = this.getStoragePath(filename, bookId);
    const fullPath = this.getFullPath(storagePath);

    try {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file);

      const image = await this.createImage({
        bookId,
        path: storagePath,
        order: 0,
        selected: false,
        analyzed: false,
        midjourney: null,
        analysis: null
      });

      return [image];
    } catch (error) {
      log.error(`Failed to save single image: ${error}`);
      throw error;
    }
  }

  async saveUploadedFile(file: Buffer, filename: string, bookId: number): Promise<Image[]> {
    try {
      const isZip = file[0] === 0x50 && file[1] === 0x4B && file[2] === 0x03 && file[3] === 0x04;

      if (isZip) {
        return await this.processZipFile(file, bookId);
      } else {
        return await this.saveSingleImage(file, filename, bookId);
      }
    } catch (error) {
      log.error(`Failed to save uploaded file: ${error}`);
      throw new Error(`Failed to save uploaded file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async processZipFile(zipBuffer: Buffer, bookId: number): Promise<Image[]> {
    const directory = await unzipper.Open.buffer(zipBuffer);
    const imageFiles = directory.files.filter(file => {
      return file && 
             typeof file.path === 'string' && 
             !file.path.startsWith('__MACOSX') &&
             !file.path.startsWith('.') &&
             /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.path);
    });

    if (!imageFiles.length) {
      throw new Error('No valid image files found in ZIP');
    }

    const savedImages: Image[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileName = path.basename(file.path);
      const storagePath = this.getStoragePath(fileName, bookId);
      const fullPath = this.getFullPath(storagePath);

      try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        const content = await file.buffer();
        await fs.writeFile(fullPath, content);

        const image = await this.createImage({
          bookId,
          path: storagePath,
          order: i,
          selected: false,
          analyzed: false,
          midjourney: null,
          analysis: null
        });

        savedImages.push(image);
      } catch (error) {
        log.error(`Error processing ZIP image ${fileName}: ${error}`);
        continue;
      }
    }

    if (!savedImages.length) {
      throw new Error('Failed to process any images from ZIP');
    }

    return savedImages;
  }

  async deleteImage(id: number): Promise<void> {
    try {
      const image = await this.getImage(id);
      if (!image) {
        throw new Error('Image not found');
      }

      const storagePath = image.path.replace('/uploads/', '');
      const fullPath = this.getFullPath(storagePath);

      try {
        await fs.unlink(fullPath);
      } catch (error) {
        log.warn(`Failed to delete image file ${fullPath}: ${error}`);
      }

      await db.delete(images).where(eq(images.id, id));
    } catch (error) {
      log.error(`Failed to delete image ${id}: ${error}`);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Story methods
  async createStory(story: InsertStory): Promise<Story> {
    try {
      const [newStory] = await db.insert(stories).values(story).returning();
      return newStory;
    } catch (error) {
      log.error(`Failed to create story: ${error}`);
      throw new Error(`Failed to create story: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getStory(id: number): Promise<Story | undefined> {
    try {
      const [story] = await db.select().from(stories).where(eq(stories.id, id));
      return story;
    } catch (error) {
      log.error(`Failed to get story ${id}: ${error}`);
      throw new Error(`Failed to get story: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Custom art style methods
  async createCustomArtStyle(style: InsertCustomArtStyle): Promise<CustomArtStyle> {
    try {
      const [newStyle] = await db.insert(customArtStyles).values(style).returning();
      return newStyle;
    } catch (error) {
      log.error(`Failed to create custom art style: ${error}`);
      throw new Error(`Failed to create custom art style: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCustomArtStyle(id: number): Promise<CustomArtStyle | undefined> {
    try {
      const [style] = await db.select().from(customArtStyles).where(eq(customArtStyles.id, id));
      return style;
    } catch (error) {
      log.error(`Failed to get custom art style ${id}: ${error}`);
      throw new Error(`Failed to get custom art style: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listCustomArtStyles(): Promise<CustomArtStyle[]> {
    try {
      return await db.select().from(customArtStyles);
    } catch (error) {
      log.error(`Failed to list custom art styles: ${error}`);
      throw new Error(`Failed to list custom art styles: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateCustomArtStyle(id: number, style: Partial<InsertCustomArtStyle>): Promise<CustomArtStyle> {
    try {
      const [updatedStyle] = await db.update(customArtStyles)
        .set(style)
        .where(eq(customArtStyles.id, id))
        .returning();
      return updatedStyle;
    } catch (error) {
      log.error(`Failed to update custom art style ${id}: ${error}`);
      throw new Error(`Failed to update custom art style: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Debug methods
  async getDebugLogs() {
    return this.debugLogs;
  }

  async addDebugLog(service: DebugLog["service"], type: DebugLog["type"], content: any) {
    const newLog: DebugLog = {
      timestamp: new Date().toISOString(),
      service,
      type,
      content
    };
    this.debugLogs[service] = [...this.debugLogs[service].slice(-99), newLog];
  }
}

export const storage = new DatabaseStorage();