import { images, type Image, type InsertImage } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as fs from 'fs/promises';
import * as path from 'path';
import * as unzipper from 'unzipper';

export interface IStorage {
  createImage(image: InsertImage): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  listImages(options?: { analyzed?: boolean; selected?: boolean }): Promise<Image[]>;
  updateImageMetadata(id: number, metadata: Partial<InsertImage>): Promise<Image>;
  saveUploadedFile(file: Buffer, filename: string, bookId: number): Promise<Image[]>;
}

export class DatabaseStorage implements IStorage {
  private readonly uploadsDir: string;

  constructor() {
    this.uploadsDir = path.resolve(process.cwd(), 'uploads');
    // Ensure uploads directory exists
    fs.mkdir(this.uploadsDir, { recursive: true }).catch(console.error);
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    try {
      const [image] = await db.insert(images)
        .values(insertImage)
        .returning();
      return image;
    } catch (error) {
      throw new Error(`Failed to create image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getImage(id: number): Promise<Image | undefined> {
    try {
      const [image] = await db.select()
        .from(images)
        .where(eq(images.id, id))
        .limit(1);
      return image;
    } catch (error) {
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
      throw new Error(`Failed to list images: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateImageMetadata(id: number, metadata: Partial<InsertImage>): Promise<Image> {
    try {
      const [image] = await db.update(images)
        .set(metadata)
        .where(eq(images.id, id))
        .returning();
      return image;
    } catch (error) {
      throw new Error(`Failed to update image metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async saveSingleImage(file: Buffer, filename: string, bookId: number): Promise<Image[]> {
    const filePath = path.join(`book-${bookId}`, filename);
    const fullPath = path.join(this.uploadsDir, filePath);

    // Ensure the book directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Save the file
    await fs.writeFile(fullPath, file);

    // Create database record
    const image = await this.createImage({
      bookId,
      path: filePath,
      order: 0,
      selected: false,
      analyzed: false,
      analysis: null
    });

    return [image];
  }

  private async processZipFile(zipBuffer: Buffer, bookId: number): Promise<Image[]> {
    const directory = await unzipper.Open.buffer(zipBuffer);
    const imageFiles = directory.files.filter(file => 
      !file.path.startsWith('__MACOSX') && 
      /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.path)
    );

    const savedImages: Image[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileName = path.basename(file.path);
      const filePath = path.join(`book-${bookId}`, fileName);
      const fullPath = path.join(this.uploadsDir, filePath);

      // Ensure the book directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Extract and save the file
      const content = await file.buffer();
      await fs.writeFile(fullPath, content);

      // Create database record
      const image = await this.createImage({
        bookId,
        path: filePath,
        order: i,
        selected: false,
        analyzed: false,
        analysis: null
      });

      savedImages.push(image);
    }

    return savedImages;
  }

  async saveUploadedFile(file: Buffer, filename: string, bookId: number): Promise<Image[]> {
    try {
      // Check if file is a ZIP by looking at magic numbers
      const isZip = file[0] === 0x50 && file[1] === 0x4B && file[2] === 0x03 && file[3] === 0x04;

      if (isZip) {
        return await this.processZipFile(file, bookId);
      } else {
        return await this.saveSingleImage(file, filename, bookId);
      }
    } catch (error) {
      throw new Error(`Failed to process uploaded file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const storage = new DatabaseStorage();