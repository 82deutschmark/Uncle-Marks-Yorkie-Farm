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
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true
});

// Types
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;

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