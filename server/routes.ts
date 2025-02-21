import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { generateStory, analyzeImage } from "./lib/openai";
import { insertStorySchema } from "@shared/schema";
import multer from "multer";
import { imageStorage } from "./lib/object-storage";
import fs from "fs/promises";
import * as unzipper from "unzipper";
import { Readable } from "stream";
import path from "path";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Add route to serve images from memory storage
  app.get("/api/images/memory/:key", (req, res) => {
    const imageData = imageStorage.getMemoryImage(req.params.key);
    if (!imageData) {
      return res.status(404).json({ message: "Image not found" });
    }
    res.setHeader('Content-Type', 'image/png');
    res.send(imageData);
  });

  // Configure multer for handling PNG and ZIP uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'image/png') {
        cb(null, true);
        return;
      }
      // Check for ZIP files
      if (file.mimetype === 'application/zip' || 
          file.mimetype === 'application/x-zip-compressed' ||
          file.mimetype === 'application/octet-stream') {
        cb(null, true);
        return;
      }
      cb(new Error('Only PNG images and ZIP files are allowed'));
    }
  });

  async function processZipFile(buffer: Buffer): Promise<Array<{buffer: Buffer, filename: string}>> {
    const extractedImages: Array<{buffer: Buffer, filename: string}> = [];

    try {
      const directory = await unzipper.Open.buffer(buffer);

      for (const entry of directory.files) {
        // Skip directories and non-PNG files
        if (entry.type !== 'File') continue;

        const ext = path.extname(entry.path).toLowerCase();
        if (ext !== '.png') continue;

        try {
          const content = await entry.buffer();
          extractedImages.push({
            buffer: content,
            filename: path.basename(entry.path)
          });
        } catch (error) {
          console.error(`Failed to extract ${entry.path}:`, error);
          // Continue with other files even if one fails
          continue;
        }
      }

      return extractedImages;
    } catch (error) {
      throw new Error(`Failed to process ZIP file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  app.post("/api/images/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      let imagesToProcess: Array<{buffer: Buffer, filename: string}> = [];

      // Handle zip files
      if (req.file.mimetype === 'application/zip' || 
          req.file.mimetype === 'application/x-zip-compressed' ||
          req.file.mimetype === 'application/octet-stream') {
        try {
          imagesToProcess = await processZipFile(req.file.buffer);
          if (imagesToProcess.length === 0) {
            return res.status(400).json({ message: "No PNG images found in ZIP file" });
          }
        } catch (error) {
          return res.status(400).json({ 
            message: error instanceof Error ? error.message : "Failed to process ZIP file" 
          });
        }
      } else {
        // Single PNG file
        imagesToProcess = [{
          buffer: req.file.buffer,
          filename: req.file.originalname
        }];
      }

      const uploadedImages = [];
      const errors = [];

      for (const image of imagesToProcess) {
        try {
          const { fileId, objectUrl } = await imageStorage.uploadImage(
            image.buffer,
            image.filename
          );

          const dbImage = await storage.createImage({
            fileId,
            objectUrl,
            isProcessed: false,
            tags: [],
          });

          uploadedImages.push(dbImage);
        } catch (error) {
          errors.push({
            filename: image.filename,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Return partial success if some images were uploaded
      if (uploadedImages.length > 0) {
        res.status(errors.length > 0 ? 207 : 200).json({
          message: `Successfully uploaded ${uploadedImages.length} images${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
          images: uploadedImages,
          errors: errors.length > 0 ? errors : undefined
        });
      } else {
        res.status(500).json({
          message: "Failed to upload any images",
          errors
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Error uploading images';
      res.status(500).json({ message });
    }
  });

  // Only analyze image when requested
  app.post("/api/images/:id/analyze", async (req, res) => {
    try {
      const image = await storage.getImage(Number(req.params.id));
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      if (image.isProcessed && image.characterProfile) {
        return res.json(image);
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