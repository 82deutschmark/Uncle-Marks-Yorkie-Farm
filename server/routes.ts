import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { generateStory } from "./lib/openai";
import { insertStorySchema } from "@shared/schema";
import multer from "multer";
import { storageClient } from "./lib/object-storage";
import path from "path";
import { log } from "./lib/logger";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Configure multer for handling ZIP uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'application/zip' ||
          file.mimetype === 'application/x-zip-compressed' ||
          file.mimetype === 'application/octet-stream') {
        cb(null, true);
        return;
      }
      cb(new Error('Only ZIP files are allowed'));
    }
  });

  app.post("/api/stories/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      // Upload file to object storage
      const key = await storageClient.uploadFile(
        req.file.buffer,
        req.file.originalname
      );

      // Get the signed URL for the uploaded file
      const objectUrl = await storageClient.getFileUrl(key);

      // Create story in database
      const storyData = {
        title: req.body.title || "Untitled Story",
        content: "",  // Will be populated after processing
        characteristics: req.body.characteristics,
        colors: req.body.colors,
        setting: req.body.setting,
        theme: req.body.theme,
        antagonist: req.body.antagonist,
        metadata: {
          zipFileKey: key,
          zipFileUrl: objectUrl
        }
      };

      const validated = insertStorySchema.parse(storyData);
      const story = await storage.createStory(validated);

      res.json({
        message: "Story package uploaded successfully",
        story
      });
    } catch (error) {
      log('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Error uploading story package';
      res.status(500).json({ message });
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
      const message = error instanceof Error ? error.message : 'Error fetching story';
      res.status(500).json({ message });
    }
  });

  return httpServer;
}