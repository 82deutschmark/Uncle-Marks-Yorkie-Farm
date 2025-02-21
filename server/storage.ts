import { stories, images, type Story, type InsertStory, type Image, type InsertImage } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { imageStorage } from "./lib/object-storage";

export interface IStorage {
  // Story operations
  createStory(story: InsertStory): Promise<Story>;
  getStory(id: number): Promise<Story | undefined>;
  listStories(): Promise<Story[]>;

  // Image operations
  createImage(image: InsertImage): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  listImages(options?: { processed?: boolean }): Promise<Image[]>;
  updateImageMetadata(id: number, metadata: Partial<InsertImage>): Promise<Image>;
}

export class PostgresStorage implements IStorage {
  // Story operations
  async createStory(insertStory: InsertStory): Promise<Story> {
    try {
      const [story] = await db.insert(stories)
        .values(insertStory)
        .returning();
      return story;
    } catch (error) {
      throw new Error(`Failed to create story: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getStory(id: number): Promise<Story | undefined> {
    try {
      const [story] = await db.select()
        .from(stories)
        .where(eq(stories.id, id))
        .limit(1);
      return story;
    } catch (error) {
      throw new Error(`Failed to get story: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listStories(): Promise<Story[]> {
    try {
      return await db.select().from(stories);
    } catch (error) {
      throw new Error(`Failed to list stories: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Image operations
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

  async listImages(options?: { processed?: boolean }): Promise<Image[]> {
    try {
      let query = db.select().from(images);
      if (options?.processed !== undefined) {
        query = query.where(eq(images.isProcessed, options.processed));
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
}

// For development/testing, we can still use MemStorage
export class MemStorage implements IStorage {
  private stories: Map<number, Story>;
  private images: Map<number, Image>;
  private currentStoryId: number;
  private currentImageId: number;

  constructor() {
    this.stories = new Map();
    this.images = new Map();
    this.currentStoryId = 1;
    this.currentImageId = 1;
  }

  // Story operations
  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.currentStoryId++;
    const story: Story = {
      id,
      createdAt: new Date(),
      ...insertStory
    };
    this.stories.set(id, story);
    return story;
  }

  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async listStories(): Promise<Story[]> {
    return Array.from(this.stories.values());
  }

  // Image operations
  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = this.currentImageId++;
    const image: Image = {
      id,
      createdAt: new Date(),
      ...insertImage,
      tags: insertImage.tags ?? null,
      description: insertImage.description ?? null,
      characterProfile: insertImage.characterProfile ?? null,
      isProcessed: insertImage.isProcessed ?? false
    };
    this.images.set(id, image);
    return image;
  }

  async getImage(id: number): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async listImages(options?: { processed?: boolean }): Promise<Image[]> {
    let images = Array.from(this.images.values());
    if (options?.processed !== undefined) {
      images = images.filter(img => img.isProcessed === options.processed);
    }
    return images;
  }

  async updateImageMetadata(id: number, metadata: Partial<InsertImage>): Promise<Image> {
    const image = await this.getImage(id);
    if (!image) throw new Error(`Image with id ${id} not found`);

    const updatedImage: Image = {
      ...image,
      tags: metadata.tags ?? image.tags,
      description: metadata.description ?? image.description,
      characterProfile: metadata.characterProfile ?? image.characterProfile,
      isProcessed: metadata.isProcessed ?? image.isProcessed,
      id: image.id,
      createdAt: image.createdAt,
      fileId: metadata.fileId ?? image.fileId,
      objectUrl: metadata.objectUrl ?? image.objectUrl
    };
    this.images.set(id, updatedImage);
    return updatedImage;
  }
}

// Export PostgresStorage instance since we have a database
export const storage = new PostgresStorage();