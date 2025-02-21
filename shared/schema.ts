import { pgTable, text, serial, integer, json, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table for storing image metadata
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  fileId: text("file_id").notNull().unique(), // Unique identifier for the image in Object Storage
  objectUrl: text("object_url").notNull(), // URL to access the image
  tags: text("tags").array(), // Array of tags for categorizing images
  description: text("description"), // AI-generated description
  characterProfile: json("character_profile").$type<{
    name?: string;
    personality?: string;
    description?: string;
  }>(), // AI-generated character profile
  isProcessed: boolean("is_processed").default(false), // Track if metadata has been generated
  createdAt: timestamp("created_at").defaultNow()
});

// Table for storing generated stories
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  protagonist: text("protagonist").notNull(),
  setting: text("setting").notNull(),
  theme: text("theme").notNull(),
  content: text("content").notNull(),
  selectedImages: json("selected_images").$type<{
    slot1: number;
    slot2: number;
    slot3: number;
  }>().notNull(), // References to the three selected images
  metadata: json("metadata").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true
});

// Types
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;