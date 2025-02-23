import type { Express, Request } from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import express from "express";
import { storage } from "./storage";
import { log } from "./lib/logger";
import { generateStory, analyzeImage } from "./lib/openai";
import { insertStorySchema, midjourneyPromptSchema, type StoryParams } from "@shared/schema";
import { OpenAIError } from "./lib/errors";
import * as fs from 'fs/promises';
import { sendMidJourneyPrompt } from "./lib/discord";
import { DiscordError } from "./lib/errors";

// Add multer request type
interface MulterRequest extends Request {
  file?: Express.Multer.File
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Add JSON body parsing middleware
  app.use(express.json());

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Configure multer without restrictions
  const upload = multer({
    storage: multer.memoryStorage()
  });

  // Generate story endpoint
  app.post("/api/stories/generate", async (req, res) => {
    try {
      const storyParams: StoryParams = {
        protagonist: {
          name: req.body.name,
          personality: req.body.characteristics,
          appearance: req.body.colors
        },
        antagonist: {
          type: req.body.antagonist,
          personality: req.body.antagonist
        },
        theme: req.body.theme,
        mood: req.body.theme,
        artStyle: req.body.artStyle || {
          style: "whimsical",
          description: "A playful and enchanting style perfect for children's stories"
        }
      };

      const storyResponse = await generateStory(storyParams);

      const story = {
        title: storyResponse.title,
        protagonist: `${req.body.colors} Yorkshire Terrier`,
        setting: req.body.setting,
        theme: req.body.theme,
        content: storyResponse.content,
        selectedImages: {
          slot1: 1,
          slot2: 2,
          slot3: 3
        },
        metadata: {
          characteristics: req.body.characteristics,
          colors: req.body.colors,
          antagonist: req.body.antagonist,
          ...storyResponse.metadata
        },
        artStyle: storyResponse.artStyle
      };

      const parsedStory = insertStorySchema.parse(story);
      const savedStory = await storage.createStory(parsedStory);
      res.json(savedStory);
    } catch (error) {
      log('Story generation error:', error);

      if (error instanceof OpenAIError) {
        return res.status(error.statusCode).json({
          error: 'AI Generation Error',
          message: error.message,
          retry: error.statusCode === 429
        });
      }

      res.status(500).json({
        error: 'Failed to generate story',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retry: false
      });
    }
  });

  // Get story by ID
  app.get("/api/stories/:id", async (req, res) => {
    try {
      const storyId = parseInt(req.params.id, 10);
      const story = await storage.getStory(storyId);

      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      res.json(story);
    } catch (error) {
      log('Error fetching story:', error);
      res.status(500).json({
        error: 'Failed to fetch story',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // File upload endpoint with proper typing
  app.post("/api/upload", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        log('Upload failed: No file provided');
        return res.status(400).json({ error: 'No file provided' });
      }

      const bookId = parseInt(req.body.bookId || '1', 10);

      // Log upload details
      log('Processing upload:', {
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        bookId
      });

      // Process the file (either ZIP or single image)
      const images = await storage.saveUploadedFile(req.file.buffer, req.file.originalname, bookId);
      log(`Successfully processed ${images.length} image(s)`);

      // Return success with image data
      res.json({
        message: 'Upload successful',
        images: images.map(img => ({
          id: img.id,
          path: `/uploads/${img.path}`,
          order: img.order
        }))
      });
    } catch (error) {
      log('Upload error:', error);
      res.status(500).json({
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add image analysis endpoint
  app.post("/api/images/:id/analyze", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id, 10);
      const image = await storage.getImage(imageId);

      if (!image) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Image not found'
        });
      }

      const imagePath = path.join(process.cwd(), 'uploads', image.path);
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const analysis = await analyzeImage(base64Image);

      const updatedImage = await storage.updateImageMetadata(imageId, {
        analyzed: true,
        analysis: {
          characterProfile: analysis
        }
      });

      res.json(updatedImage);
    } catch (error) {
      log('Image analysis error:', error);

      if (error instanceof OpenAIError) {
        res.status(error.statusCode).json({
          error: 'AI Analysis Error',
          message: error.message,
          retry: error.retryable
        });
        return;
      }

      res.status(500).json({
        error: 'Failed to analyze image',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retry: false
      });
    }
  });

  // Add GET endpoint for listing images
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getAllImages();
      res.json(images);
    } catch (error) {
      log('Error fetching images:', error);
      res.status(500).json({
        error: 'Failed to fetch images',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add MidJourney image generation endpoint
  app.post("/api/images/generate", async (req, res) => {
    try {
      const prompt = midjourneyPromptSchema.parse(req.body);

      // Create a new image record with pending status
      const newImage = await storage.createImage({
        bookId: 1, // Default book ID
        path: '', // Will be updated once image is generated
        order: 0,
        selected: false,
        analyzed: false,
        analysis: null,
        midjourney: {
          prompt: prompt.description,
          status: 'pending'
        }
      });

      // Send prompt to Discord
      await sendMidJourneyPrompt(prompt);

      res.json({
        message: 'Image generation started',
        imageId: newImage.id,
        status: 'pending'
      });
    } catch (error) {
      log('MidJourney prompt error:', error);

      if (error instanceof DiscordError) {
        return res.status(error.statusCode).json({
          error: 'Discord Integration Error',
          message: error.message,
          retry: error.retryable
        });
      }

      res.status(500).json({
        error: 'Failed to start image generation',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retry: false
      });
    }
  });

  return httpServer;
}