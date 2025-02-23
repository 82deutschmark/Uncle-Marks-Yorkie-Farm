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

// Update art style schema to match frontend options
export const artStyleSchema = z.object({
  style: z.enum([
    'whimsical',
    'studio-ghibli',
    'watercolor',
    'pixel-art',
    'pop-art',
    'pencil-sketch',
    '3d-cartoon',
    'storybook'
  ]),
  description: z.string()
});

// Update MidJourney prompt schema to match implementation
export const midJourneyPromptSchema = z.object({
  protagonist: z.object({
    personality: z.string(),
    appearance: z.string()
  }),
  artStyle: artStyleSchema,
  description: z.string().optional()
});

// Story parameters schema
export const storyParamsSchema = z.object({
  protagonist: z.object({
    name: z.string().optional(),
    personality: z.string().min(1, "Personality is required"),
    appearance: z.string().min(1, "Appearance is required")
  }),
  antagonist: z.object({
    type: z.enum([
      "sorcerer-basic",
      "sorcerer-squirrels",
      "squirrel-gang",
      "dark-wizard"
    ]),
    personality: z.string().min(1, "Antagonist personality is required")
  }),
  theme: z.string().min(1, "Theme is required"),
  mood: z.string().default("Lighthearted"),
  artStyle: artStyleSchema,
  farmElements: z.array(z.string()).min(1, "At least one farm element is required")
});

// Story response schema
export const storyResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  metadata: z.object({
    protagonist: z.object({
      name: z.string(),
      personality: z.string()
    }),
    image_urls: z.array(z.string()).optional(),
    wordCount: z.number(),
    chapters: z.number(),
    tone: z.string()
  })
});

// Types
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
export type InsertCustomArtStyle = z.infer<typeof insertCustomArtStyleSchema>;
export type CustomArtStyle = typeof customArtStyles.$inferSelect;
export type StoryParams = z.infer<typeof storyParamsSchema>;
export type StoryResponse = z.infer<typeof storyResponseSchema>;
export type ArtStyle = z.infer<typeof artStyleSchema>;
export type MidJourneyPrompt = z.infer<typeof midjourneyPromptSchema>;


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