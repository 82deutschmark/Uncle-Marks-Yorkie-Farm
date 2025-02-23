import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table for storing image metadata
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id"), // Links image to a specific book
  path: text("path").notNull(), // Relative path to the image file
  order: integer("order"), // For maintaining image sequence
  selected: boolean("selected").default(false), // Selection status
  analyzed: boolean("analyzed").default(false), // AI analysis completion status
  analysis: jsonb("analysis").$type<{
    description?: string;
    characterProfile?: {
      name?: string;
      personality?: string;
      description?: string;
    };
  }>(), // AI-generated analysis results
  midjourney: jsonb("midjourney").$type<{
    prompt?: string;
    status?: 'pending' | 'completed' | 'failed';
    discordMessageId?: string;
    imageUrl?: string;
    artStyle?: string;
  }>(), // MidJourney generation details
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true
});

// Custom art styles table
export const customArtStyles = pgTable("custom_art_styles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  examplePrompt: text("example_prompt"),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas for custom art styles
export const insertCustomArtStyleSchema = createInsertSchema(customArtStyles).omit({
  id: true,
  createdAt: true
});

// Update existing art style schema to include custom styles
export const artStyleSchema = z.object({
  style: z.union([
    z.enum([
      'abstract',
      'pixelated',
      'impressionist',
      'cartoon',
      'whimsical',
      'realistic',
      'watercolor',
      'digital-art',
      'studio-ghibli',
      'pop-art'
    ]),
    z.string() // Allow custom style names
  ]),
  description: z.string()
});

// Story parameters schema
export const storyParamsSchema = z.object({
  protagonist: z.object({
    name: z.string().optional(),
    personality: z.string(),
    appearance: z.string()
  }),
  antagonist: z.object({
    type: z.string(),
    personality: z.string()
  }),
  theme: z.string(),
  mood: z.string(),
  artStyle: artStyleSchema
});

// MidJourney prompt schema
export const midjourneyPromptSchema = z.object({
  description: z.string(),
  characteristics: z.array(z.string()).optional(),
  setting: z.string().optional(),
  artStyle: artStyleSchema.optional()
});

// Types
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
export type MidJourneyPrompt = z.infer<typeof midjourneyPromptSchema>;
export type StoryParams = z.infer<typeof storyParamsSchema>;
export type ArtStyle = z.infer<typeof artStyleSchema>;
export type InsertCustomArtStyle = z.infer<typeof insertCustomArtStyleSchema>;
export type CustomArtStyle = typeof customArtStyles.$inferSelect;

// Table for storing generated stories
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  protagonist: text("protagonist").notNull(),
  setting: text("setting").notNull(),
  theme: text("theme").notNull(),
  content: text("content").notNull(),
  selectedImages: jsonb("selected_images").$type<{
    slot1: number;
    slot2: number;
    slot3: number;
  }>().notNull(), // References to the three selected images
  metadata: jsonb("metadata").notNull(),
  artStyle: jsonb("art_style").$type<ArtStyle>(),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true
});

// Types
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;