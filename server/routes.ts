import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { generateStory } from "./lib/openai";
import { insertStorySchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.post("/api/stories/generate", async (req, res) => {
    try {
      const storyParams = {
        protagonist: req.body.protagonist,
        setting: req.body.setting,
        theme: req.body.theme
      };

      const generated = await generateStory(storyParams);
      const storyData = {
        ...storyParams,
        title: generated.title,
        content: generated.content,
        metadata: generated.metadata
      };

      const validated = insertStorySchema.parse(storyData);
      const story = await storage.createStory(validated);
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stories/:id", async (req, res) => {
    try {
      const story = await storage.getStory(Number(req.params.id));
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
