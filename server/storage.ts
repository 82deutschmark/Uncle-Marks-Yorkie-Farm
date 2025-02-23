import { images, stories, type Image, type InsertImage, type Story, type InsertStory } from "@shared/schema";
import { eq } from "drizzle-orm";
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

// Update IStorage interface
export interface IStorage {
  createImage(image: InsertImage): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  listImages(options?: { analyzed?: boolean; selected?: boolean }): Promise<Image[]>;
  getAllImages(): Promise<Image[]>;
  updateImageMetadata(id: number, metadata: Partial<InsertImage>): Promise<Image>;
  saveUploadedFile(file: Buffer, filename: string, bookId: number): Promise<Image[]>;
  createStory(story: InsertStory): Promise<Story>;
  getStory(id: number): Promise<Story | undefined>;
  createCustomArtStyle(style: InsertCustomArtStyle): Promise<CustomArtStyle>;
  getCustomArtStyle(id: number): Promise<CustomArtStyle | undefined>;
  listCustomArtStyles(): Promise<CustomArtStyle[]>;
  updateCustomArtStyle(id: number, style: Partial<InsertCustomArtStyle>): Promise<CustomArtStyle>;
  // Add new debug methods
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
    this.uploadsDir = path.resolve(process.cwd(), 'uploads');
    this.debugLogs = {
      openai: [],
      midjourney: []
    };
    fs.mkdir(this.uploadsDir, { recursive: true }).catch(console.error);
  }

  async createImage(image: InsertImage): Promise<Image> {
    try {
      const [newImage] = await db.insert(images)
        .values([image])
        .returning();
      log(`Created new image record: ${newImage.id}`);
      return newImage;
    } catch (error) {
      log(`Failed to create image record: ${error}`);
      throw new Error(`Failed to create image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getImage(id: number): Promise<Image | undefined> {
    try {
      const [image] = await db.select().from(images).where(eq(images.id, id));
      return image;
    } catch (error) {
      log(`Failed to get image ${id}: ${error}`);
      throw new Error(`Failed to get image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listImages(options?: { analyzed?: boolean; selected?: boolean }): Promise<Image[]> {
    try {
      let query = db.select().from(images);

      if (options?.analyzed !== undefined) {
        query = query.where(eq(images.analyzed, options.analyzed));
      }
      if (options?.selected !== undefined) {
        query = query.where(eq(images.selected, options.selected));
      }

      return await query;
    } catch (error) {
      log(`Failed to list images: ${error}`);
      throw new Error(`Failed to list images: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAllImages(): Promise<Image[]> {
    return this.listImages();
  }

  async updateImageMetadata(id: number, metadata: Partial<InsertImage>): Promise<Image> {
    try {
      const [updatedImage] = await db.update(images)
        .set({
          ...metadata,
          analysis: metadata.analysis ? {
            description: metadata.analysis.description,
            characterProfile: metadata.analysis.characterProfile
          } : undefined
        })
        .where(eq(images.id, id))
        .returning();
      return updatedImage;
    } catch (error) {
      log(`Failed to update image ${id} metadata: ${error}`);
      throw new Error(`Failed to update image metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async saveSingleImage(file: Buffer, filename: string, bookId: number): Promise<Image[]> {
    log(`Processing single image: ${filename}`);
    const filePath = path.join(`book-${bookId}`, filename);
    const fullPath = path.join(this.uploadsDir, filePath);

    try {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      log(`Created directory: ${path.dirname(fullPath)}`);
      await fs.writeFile(fullPath, file);
      log(`Saved file to: ${fullPath}`);

      const image = await this.createImage({
        bookId,
        path: filePath,
        order: 0,
        selected: false,
        analyzed: false,
        analysis: null
      });

      log(`Created database record for image: ${image.id}`);
      return [image];
    } catch (error) {
      log(`Failed to save single image ${filename}: ${error}`);
      throw error;
    }
  }

  private async processZipFile(zipBuffer: Buffer, bookId: number): Promise<Image[]> {
    log('Starting ZIP file processing');
    const directory = await unzipper.Open.buffer(zipBuffer);
    const imageFiles = directory.files.filter(file =>
      !file.path.startsWith('__MACOSX') &&
      /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.path)
    );

    log(`Found ${imageFiles.length} image files in ZIP`);
    const savedImages: Image[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileName = path.basename(file.path);
      log(`Processing ZIP image ${i + 1}/${imageFiles.length}: ${fileName}`);
      const filePath = path.join(`book-${bookId}`, fileName);
      const fullPath = path.join(this.uploadsDir, filePath);

      try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        const content = await file.buffer();
        await fs.writeFile(fullPath, content);
        log(`Saved extracted file to: ${fullPath}`);

        const image = await this.createImage({
          bookId,
          path: filePath,
          order: i,
          selected: false,
          analyzed: false,
          analysis: null
        });

        log(`Created database record for ZIP image: ${image.id}`);
        savedImages.push(image);
      } catch (error) {
        log(`Error processing ZIP image ${fileName}: ${error}`);
        continue;
      }
    }

    log(`Completed processing ${savedImages.length} images from ZIP`);
    return savedImages;
  }

  async saveUploadedFile(file: Buffer, filename: string, bookId: number): Promise<Image[]> {
    try {
      log(`Starting file upload process for: ${filename}`);
      const isZip = file[0] === 0x50 && file[1] === 0x4B && file[2] === 0x03 && file[3] === 0x04;
      log(`File type detected: ${isZip ? 'ZIP archive' : 'Single file'}`);

      if (isZip) {
        return await this.processZipFile(file, bookId);
      } else {
        return await this.saveSingleImage(file, filename, bookId);
      }
    } catch (error) {
      log(`Failed to process uploaded file ${filename}: ${error}`);
      throw new Error(`Failed to process uploaded file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createStory(story: InsertStory): Promise<Story> {
    try {
      const [newStory] = await db.insert(stories)
        .values({
          ...story,
          artStyle: story.artStyle || {
            style: "whimsical",
            description: "A playful and enchanting style perfect for children's stories"
          }
        })
        .returning();
      log(`Created new story record: ${newStory.id}`);
      return newStory;
    } catch (error) {
      log(`Failed to create story record: ${error}`);
      throw new Error(`Failed to create story: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getStory(id: number): Promise<Story | undefined> {
    try {
      const [story] = await db.select().from(stories).where(eq(stories.id, id));
      return story;
    } catch (error) {
      log(`Failed to get story ${id}: ${error}`);
      throw new Error(`Failed to get story: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createCustomArtStyle(style: InsertCustomArtStyle): Promise<CustomArtStyle> {
    try {
      const [newStyle] = await db.insert(customArtStyles)
        .values(style)
        .returning();
      log(`Created new custom art style: ${newStyle.id}`);
      return newStyle;
    } catch (error) {
      log(`Failed to create custom art style: ${error}`);
      throw new Error(`Failed to create custom art style: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCustomArtStyle(id: number): Promise<CustomArtStyle | undefined> {
    try {
      const [style] = await db.select().from(customArtStyles).where(eq(customArtStyles.id, id));
      return style;
    } catch (error) {
      log(`Failed to get custom art style ${id}: ${error}`);
      throw new Error(`Failed to get custom art style: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listCustomArtStyles(): Promise<CustomArtStyle[]> {
    try {
      return await db.select().from(customArtStyles);
    } catch (error) {
      log(`Failed to list custom art styles: ${error}`);
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
      log(`Failed to update custom art style ${id}: ${error}`);
      throw new Error(`Failed to update custom art style: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Add debug methods
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

    // Keep only the last 100 logs per service
    this.debugLogs[service] = [
      ...this.debugLogs[service].slice(-99),
      newLog
    ];
  }
}

export const storage = new DatabaseStorage();