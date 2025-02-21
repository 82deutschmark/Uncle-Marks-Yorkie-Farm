import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { generateStory, analyzeImage } from "./lib/openai";
import { insertStorySchema } from "@shared/schema";
import multer from "multer";
import { imageStorage } from "./lib/object-storage";
import fs from "fs/promises";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Configure multer for handling PNG uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype !== 'image/png') {
        cb(new Error('Only PNG files are allowed'));
        return;
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  app.post("/api/images/upload", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const { fileId, objectUrl } = await imageStorage.uploadImage(
        req.file.buffer,
        req.file.originalname
      );

      const image = await storage.createImage({
        fileId,
        objectUrl,
        isProcessed: false,
        tags: [],
      });

      res.json(image);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error uploading image';
      res.status(500).json({ message });
    }
  });

  app.post("/api/images/:id/analyze", async (req, res) => {
    try {
      const image = await storage.getImage(Number(req.params.id));
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Get the image data from object storage
      const response = await fetch(image.objectUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');

      // Analyze the image using OpenAI
      const characterProfile = await analyzeImage(base64Image);

      // Update image metadata
      const updatedImage = await storage.updateImageMetadata(image.id, {
        characterProfile,
        isProcessed: true
      });

      res.json(updatedImage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error analyzing image';
      res.status(500).json({ message });
    }
  });

  app.get("/api/images", async (req, res) => {
    try {
      const processed = req.query.processed === 'true';
      const images = await storage.listImages({ processed });
      res.json(images);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error fetching images';
      res.status(500).json({ message });
    }
  });

  app.post("/api/stories/generate", async (req, res) => {
    try {
      const storyParams = {
        characteristics: req.body.characteristics,
        colors: req.body.colors,
        setting: req.body.setting,
        theme: req.body.theme,
        antagonist: req.body.antagonist
      };

      const generated = await generateStory(storyParams);
      const storyData = {
        ...storyParams,
        title: generated.title,
        content: generated.content,
        selectedImages: req.body.selectedImages,
        metadata: generated.metadata
      };

      const validated = insertStorySchema.parse(storyData);
      const story = await storage.createStory(validated);
      res.json(story);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error generating story';
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