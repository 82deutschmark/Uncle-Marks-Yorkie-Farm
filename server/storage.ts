import { stories, type Story, type InsertStory } from "@shared/schema";

export interface IStorage {
  createStory(story: InsertStory): Promise<Story>;
  getStory(id: number): Promise<Story | undefined>;
  listStories(): Promise<Story[]>;
}

export class MemStorage implements IStorage {
  private stories: Map<number, Story>;
  private currentId: number;

  constructor() {
    this.stories = new Map();
    this.currentId = 1;
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.currentId++;
    const story: Story = { id, ...insertStory };
    this.stories.set(id, story);
    return story;
  }

  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async listStories(): Promise<Story[]> {
    return Array.from(this.stories.values());
  }
}

export const storage = new MemStorage();
