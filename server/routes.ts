import type { Express, Request } from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import express from "express";
import { storage } from "./storage";
import { log, requestLogger, errorLogger } from "./lib/logger";
import { generateStory } from "./lib/openai";
import {
  insertStorySchema,
  storyParamsSchema,
  artStyleSchema,
  midjourneyPromptSchema,
  type StoryParams,
  type MidJourneyPrompt
} from "@shared/schema";
import { OpenAIError } from "./lib/errors";
import * as fs from 'fs/promises';
import { sendMidJourneyPrompt } from "./lib/discord";
import { DiscordError } from "./lib/errors";
import { ZodError } from "zod";

const upload = multer({
  storage: multer.memoryStorage()
});

interface MulterRequest extends Request {
  file?: Express.Multer.File
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.use(requestLogger);
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Generate story endpoint
  app.post("/api/stories/generate", async (req, res) => {
    try {
      // Log the raw request body for debugging
      log.info('Raw request body:', req.body);

      try {
        // Validate parameters against schema
        const storyParams = storyParamsSchema.parse(req.body);
        log.info('Parameters validated successfully:', storyParams);

        // Generate story
        const response = await generateStory(storyParams);

        // Prepare story for database
        const story = {
          title: response.title,
          protagonist: storyParams.protagonist.appearance,
          setting: "Uncle Mark's Farm",
          theme: storyParams.theme,
          content: response.content,
          selectedImages: {
            slot1: 1,
            slot2: 2,
            slot3: 3
          },
          metadata: response.metadata,
          artStyle: storyParams.artStyle
        };

        // Validate story data
        const parsedStory = insertStorySchema.parse(story);
        const savedStory = await storage.createStory(parsedStory);

        log.info('Story saved successfully:', {
          id: savedStory.id,
          title: savedStory.title
        });

        res.json(savedStory);
      } catch (validationError) {
        if (validationError instanceof ZodError) {
          log.error('Validation error details:', {
            errors: validationError.errors,
            params: req.body
          });
          return res.status(400).json({
            error: 'Invalid Parameters',
            message: 'Story parameters validation failed',
            details: validationError.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            }))
          });
        }
        throw validationError;
      }
    } catch (error) {
      log.error('Story generation error:', error);

      if (error instanceof OpenAIError) {
        return res.status(error.statusCode).json({
          error: 'AI Generation Error',
          message: error.message,
          retry: error.statusCode === 429
        });
      }

      res.status(500).json({
        error: 'Story Generation Failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        retry: false
      });
    }
  });

  // Get story by ID
  app.get("/api/stories/:id", async (req, res) => {
    try {
      const storyId = parseInt(req.params.id, 10);
      log.info('Fetching story', { storyId });

      const story = await storage.getStory(storyId);

      if (!story) {
        log.warn('Story not found', { storyId });
        return res.status(404).json({ error: 'Story not found' });
      }

      res.json(story);
    } catch (error) {
      log.apiError('Error fetching story:', error);
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
        log.warn('Upload failed: No file provided');
        return res.status(400).json({ error: 'No file provided' });
      }

      const bookId = parseInt(req.body.bookId || '1', 10);

      // Log upload details
      log.info('Processing upload:', {
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        bookId
      });

      // Process the file (either ZIP or single image)
      const images = await storage.saveUploadedFile(req.file.buffer, req.file.originalname, bookId);
      log.info(`Successfully processed ${images.length} image(s)`);

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
      log.apiError('Upload error:', error);
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
      log.info('Analyzing image', { imageId });

      const image = await storage.getImage(imageId);

      if (!image) {
        log.warn('Image not found', { imageId });
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

      log.info('Image analysis completed', { imageId });
      res.json(updatedImage);
    } catch (error) {
      log.apiError('Image analysis error:', error);

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
      log.info('Fetching all images');
      const images = await storage.getAllImages();
      res.json(images);
    } catch (error) {
      log.apiError('Error fetching images:', error);
      res.status(500).json({
        error: 'Failed to fetch images',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // MidJourney image generation endpoint
  app.post("/api/images/generate", async (req, res) => {
    try {
      log.info('Received MidJourney generation request:', { body: req.body });

      // Parse and validate the request body
      const prompt: MidJourneyPrompt = midjourneyPromptSchema.parse(req.body);
      log.info('Starting MidJourney image generation', { prompt });

      // Create a new image record with pending status
      const newImage = await storage.createImage({
        bookId: 1, // Default book ID
        path: '', // Will be updated once image is generated
        order: 0,
        selected: false,
        analyzed: false,
        midjourney: {
          prompt: prompt.description || `A Yorkshire Terrier ${prompt.protagonist.appearance} with ${prompt.protagonist.personality} personality`,
          status: 'pending',
          artStyle: prompt.artStyle.style
        }
      });

      // Send prompt to Discord
      await sendMidJourneyPrompt(prompt);

      log.info('Image generation started', { imageId: newImage.id });
      res.json({
        message: 'Image generation started',
        imageId: newImage.id,
        status: 'pending',
        imageIds: [newImage.id] // Adding imageIds to match the expected response format
      });
    } catch (error) {
      log.error('MidJourney prompt error:', error);

      if (error instanceof DiscordError) {
        return res.status(error.statusCode).json({
          error: 'Discord Integration Error',
          message: error.message,
          retry: error.retryable
        });
      }

      // Handle validation errors
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'The request payload is invalid',
          details: error.errors
        });
      }

      res.status(500).json({
        error: 'Failed to start image generation',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retry: false
      });
    }
  });

  // Add debug logs endpoint
  app.get("/api/debug/logs", async (req, res) => {
    try {
      const logs = await storage.getDebugLogs();
      res.json(logs);
    } catch (error) {
      log.error('Error fetching debug logs:', error);
      res.status(500).json({
        error: 'Failed to fetch debug logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add error logging middleware last
  app.use(errorLogger);
  return httpServer;
}