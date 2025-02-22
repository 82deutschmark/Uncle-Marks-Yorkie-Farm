import { images, type Image, type InsertImage } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as fs from 'fs/promises';
import * as path from 'path';
import * as unzipper from 'unzipper';
import { log } from "./lib/logger";

export interface IStorage {
  createImage(image: InsertImage): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  listImages(options?: { analyzed?: boolean; selected?: boolean }): Promise<Image[]>;
  getAllImages(): Promise<Image[]>;
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

  async createImage(image: InsertImage): Promise<Image> {
    try {
      const [newImage] = await db.insert(images)
        .values(image)
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
      const results = await query;
      return results;
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
      const [image] = await db.update(images)
        .set(metadata)
        .where(eq(images.id, id))
        .returning();
      return image;
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
      // Ensure the book directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      log(`Created directory: ${path.dirname(fullPath)}`);

      // Save the file
      await fs.writeFile(fullPath, file);
      log(`Saved file to: ${fullPath}`);

      // Create database record
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
        // Ensure the book directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });

        // Extract and save the file
        const content = await file.buffer();
        await fs.writeFile(fullPath, content);
        log(`Saved extracted file to: ${fullPath}`);

        // Create database record
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
        // Continue processing other images even if one fails
        continue;
      }
    }

    log(`Completed processing ${savedImages.length} images from ZIP`);
    return savedImages;
  }

  async saveUploadedFile(file: Buffer, filename: string, bookId: number): Promise<Image[]> {
    try {
      log(`Starting file upload process for: ${filename}`);

      // Check if file is a ZIP by looking at magic numbers
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
}

export const storage = new DatabaseStorage();