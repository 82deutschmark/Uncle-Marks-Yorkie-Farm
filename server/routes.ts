import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import express from "express";
import { storage } from "./storage";
import { log } from "./lib/logger";
import OpenAI from "openai";
import { insertStorySchema } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Configure multer without restrictions
  const upload = multer({
    storage: multer.memoryStorage()
  });

  // Generate story endpoint
  app.post("/api/stories/generate", async (req, res) => {
    try {
      const { characteristics, colors, setting, theme, antagonist } = req.body;

      // Generate story using OpenAI
      const prompt = `Create a short children's story about a Yorkshire Terrier with the following details:
- Characteristics: ${characteristics}
- Colors: ${colors}
- Setting: ${setting}
- Theme: ${theme}
- Antagonist: ${antagonist}

The story should be engaging for children, incorporating the Yorkie's characteristics and the antagonist in a fun way.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a children's story writer specializing in tales about Yorkshire Terriers living on Uncle Mark's magical farm."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const generatedStory = completion.choices[0].message.content;

      // Create story in database
      const story = {
        title: `${characteristics} Yorkie's Adventure`,
        protagonist: `${colors} Yorkshire Terrier`,
        setting,
        theme,
        content: generatedStory || "Once upon a time...",
        selectedImages: {
          slot1: 1,
          slot2: 2,
          slot3: 3
        },
        metadata: {
          characteristics,
          colors,
          antagonist
        }
      };

      // Validate story data
      const parsedStory = insertStorySchema.parse(story);

      // Save to database
      const savedStory = await storage.createStory(parsedStory);

      res.json(savedStory);
    } catch (error) {
      log('Story generation error:', error);
      res.status(500).json({
        error: 'Failed to generate story',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all images
  app.get("/api/images", async (_req, res) => {
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

  app.post("/api/upload", upload.single('file'), async (req, res) => {
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

  return httpServer;
}