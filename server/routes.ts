import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import express from "express";
import { z } from "zod";
import fs from 'fs/promises';
import unzipper from 'unzipper';

const upload = multer({
  dest: path.resolve(process.cwd(), 'uploads'),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

import { requestLogger, errorLogger } from "./lib/logger";
import { generateStoryHandler, getStoryHandler } from "./controllers/storyController";
import { uploadImageHandler, analyzeImageHandler, generateImageHandler } from "./controllers/imageController";
import type { Request } from "express";
import { storage } from "./storage";
import { log } from "./lib/logger";
import { generateStory } from "./lib/openai";
import { findSimilarYorkieImage } from "./lib/discord";
import {
  insertStorySchema,
  storyParamsSchema,
  artStyleSchema,
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

  // New route to process ZIP files
  app.post("/api/process-zip", async (req, res) => {
    try {
      const zipPath = path.join(process.cwd(), 'attached_assets', 'midjourney_session_2025-2-23_[100-115].zip');
      const zipBuffer = await fs.readFile(zipPath);

      log.info('Processing ZIP file from assets');
      const processedImages = await storage.saveUploadedFile(zipBuffer, 'midjourney_batch.zip', 1);

      res.json({
        success: true,
        message: `Successfully processed ${processedImages.length} images`,
        images: processedImages
      });
    } catch (error) {
      log.error('Failed to process ZIP file:', error);
      res.status(500).json({ 
        error: "Failed to process ZIP file",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/images/random", async (req, res) => {
    try {
      const images = await storage.listImages({ analyzed: true });
      const shuffled = images.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      const imagesFormatted = selected.map(img => ({
        id: img.id,
        url: img.path.startsWith('/') ? img.path : `/${img.path}`
      }));
      res.json({ images: imagesFormatted });
    } catch (error) {
      log.error('Failed to fetch random images:', error);
      res.status(500).json({ error: 'Failed to fetch random images' });
    }
  });

  app.post("/api/images/search", async (req, res) => {
    try {
      const { description } = req.body;
      log.info('Starting image search with description:', { description });

      await storage.addDebugLog("midjourney", "request", {
        description,
        timestamp: new Date().toISOString()
      });

      const result = await findSimilarYorkieImage(description);

      await storage.addDebugLog("midjourney", "response", {
        result,
        timestamp: new Date().toISOString()
      });

      log.info('Image search completed successfully:', { resultCount: result.images?.length });
      res.json(result);
    } catch (error) {
      log.error('Image search failed:', error);
      res.status(500).json({ 
        error: "Failed to search for images",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.use(errorLogger);
  return httpServer;
}