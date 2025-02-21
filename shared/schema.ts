import { pgTable, text, serial, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  protagonist: text("protagonist").notNull(),
  setting: text("setting").notNull(),
  theme: text("theme").notNull(),
  content: text("content").notNull(),
  metadata: json("metadata").notNull()
});

export const insertStorySchema = createInsertSchema(stories).pick({
  title: true,
  protagonist: true,
  setting: true,
  theme: true,
  content: true,
  metadata: true
});

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
