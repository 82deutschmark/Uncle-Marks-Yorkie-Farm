import { Request, Response } from "express";
import { storage } from "../storage";
import { log } from "../lib/logger";
import { analyzeImage } from "../lib/openai";
import { OpenAIError } from "../lib/errors";
import { midJourneyPromptSchema } from "@shared/schema";
import { ZodError } from "zod";
import * as fs from 'fs/promises';
import path from "path";

export async function uploadImageHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      log.warn('Upload failed: No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    const bookId = parseInt(req.body.bookId || '1', 10);

    log.info('Processing upload:', {
      filename: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      bookId
    });

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const images = await storage.saveUploadedFile(req.file.buffer, req.file.originalname, bookId);
    log.info(`Successfully processed ${images.length} image(s)`);

    res.json({
      message: 'Upload successful',
      images: images.map(img => ({
        id: img.id,
        path: img.path,
        order: img.order
      }))
    });
  } catch (error) {
    log.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function analyzeImageHandler(req: Request, res: Response) {
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

    // Clean up the image path
    const imagePath = image.path.replace(/^(\/?uploads\/)?/, '');
    const fullImagePath = path.join(process.cwd(), 'uploads', imagePath);

    try {
      const imageBuffer = await fs.readFile(fullImagePath);
      const base64Image = imageBuffer.toString('base64');

      log.info('Successfully read image file, sending to OpenAI for analysis');

      const analysis = await analyzeImage(base64Image);

      const updatedImage = await storage.updateImageMetadata(imageId, {
        analyzed: true,
        analysis: {
          description: analysis.description,
          characterProfile: {
            name: analysis.name,
            personality: analysis.personality,
            description: analysis.description
          }
        }
      });

      log.info('Image analysis completed successfully', { imageId });

      res.json({
        id: imageId,
        ...analysis,
        path: updatedImage.path
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        log.error('Image file not found:', { path: fullImagePath });
        return res.status(404).json({
          error: 'File Not Found',
          message: 'Image file could not be found on the server'
        });
      }
      throw error;
    }
  } catch (error) {
    log.error('Image analysis error:', error);

    if (error instanceof OpenAIError) {
      return res.status(error.statusCode || 500).json({
        error: 'AI Analysis Error',
        message: error.message,
        retry: error.retryable
      });
    }

    res.status(500).json({
      error: 'Failed to analyze image',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      retry: false
    });
  }
}

export async function generateImageHandler(req: Request, res: Response) {
  try {
    log.info('Received MidJourney generation request:', { body: req.body });
    const prompt = midJourneyPromptSchema.parse(req.body);

    const result = await generateImage(prompt);
    res.json(result);
  } catch (error) {
    log.error('MidJourney prompt error:', error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'The request payload is invalid',
        details: error.errors
      });
    }

    res.status(error?.status || 500).json({
      error: 'Failed to start image generation',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      retry: false
    });
  }
}

export async function generateImage(prompt: MidJourneyPrompt) {
  try {
    const newImage = await storage.createImage({
      bookId: 1,
      path: '',
      order: 0,
      selected: false,
      analyzed: false,
      midjourney: {
        prompt: prompt.description || `A Yorkshire Terrier ${prompt.protagonist.appearance} with ${prompt.protagonist.personality} personality`,
        status: 'completed',
        artStyle: prompt.artStyle.style
      }
    });

    log.info('Image generation started', { imageId: newImage.id });
    return {
      message: 'Image generation started',
      imageId: newImage.id,
      status: 'completed',
      imageIds: [newImage.id]
    };
  } catch (error) {
    log.error('Image generation error:', error);

    if (error instanceof ZodError) {
      throw {
        status: 400,
        message: 'The request payload is invalid',
        details: error.errors
      };
    }

    throw {
      status: 500,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}