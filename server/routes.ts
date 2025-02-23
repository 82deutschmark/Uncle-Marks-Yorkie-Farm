import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import express from "express";

const upload = multer({
  dest: path.resolve(process.cwd(), 'uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
import { requestLogger, errorLogger } from "./lib/logger";
import { generateStoryHandler, getStoryHandler } from "./controllers/storyController";
import { uploadImageHandler, analyzeImageHandler, generateImageHandler } from "./controllers/imageController";
import type { Request } from "express";
import { storage } from "./storage";
import { log } from "./lib/logger";
import { generateStory } from "./lib/openai";
// Discord integration removed
import {
  insertStorySchema,
  storyParamsSchema,
  artStyleSchema,
  midjourneyPromptSchema,
  type StoryParams,
  type MidJourneyPrompt
} from "@shared/schema";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.use(requestLogger);
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Story routes
  app.post("/api/stories/generate", generateStoryHandler);
  app.get("/api/stories/:id", getStoryHandler);

  // Image routes
  app.post("/api/upload", upload.single('file'), uploadImageHandler);
  app.post("/api/images/:id/analyze", analyzeImageHandler);
  app.post("/api/images/generate", generateImageHandler);

  app.get("/api/images/random", async (req, res) => {
    try {
      const images = await storage.listImages({ analyzed: true });
      const shuffled = images.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      res.json({ images: selected });
    } catch (error) {
      log.error('Failed to fetch random images:', error);
      res.status(500).json({ error: 'Failed to fetch random images' });
    }
  });

  app.post("/api/images/search", async (req, res) => {
    try {
      const { description } = req.body;
      log.info('Starting image search with description:', { description });

      await storage.addDebugLog("discord", "request", {
        description,
        timestamp: new Date().toISOString()
      });

      const result = await findSimilarYorkieImage(description);

      await storage.addDebugLog("discord", "response", {
        result,
        timestamp: new Date().toISOString()
      });

      log.info('Image search completed successfully:', { resultCount: result.images?.length });
      res.json(result);
    } catch (error) {
      log.error('Image search failed:', { error: error.message, stack: error.stack });
      console.error('Search error:', error);
      res.status(500).json({ 
        error: "Failed to search for images",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.use(errorLogger);
  return httpServer;
}