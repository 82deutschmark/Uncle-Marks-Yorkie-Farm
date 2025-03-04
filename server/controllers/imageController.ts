import { Request, Response } from "express";
import { storage } from "../storage";
import { log } from "../lib/logger";
import { analyzeImage, generateDallEImage } from "../lib/openai";
import { OpenAIError } from "../lib/errors";
import { midJourneyPromptSchema, dallePromptSchema } from "@shared/schema";
import { ZodError } from "zod";
import * as fs from 'fs/promises';
import path from "path";
import crypto from "crypto";

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

    res.status(200).json({ 
      success: true, 
      message: `Successfully uploaded ${images.length} image(s)`,
      images
    });
  } catch (error) {
    log.error('Upload failed:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export async function analyzeImageHandler(req: Request, res: Response) {
  try {
    const imageId = parseInt(req.params.id, 10);
    if (isNaN(imageId)) {
      return res.status(400).json({ error: 'Invalid image ID' });
    }

    log.info('Initiating image analysis for image:', { imageId });

    const image = await storage.getImage(imageId);
    if (!image) {
      log.warn('Image not found:', { imageId });
      return res.status(404).json({ error: 'Image not found' });
    }

    // Check if image is already analyzed
    if (image.analyzed) {
      log.info('Image already analyzed:', { imageId });
      return res.json({
        id: imageId,
        description: image.analysis?.description || '',
        name: image.analysis?.characterProfile?.name || '',
        personality: image.analysis?.characterProfile?.personality || '',
        path: image.path
      });
    }

    try {
      const relativePath = storage.normalizePath(image.path);
      const fullImagePath = path.join(process.cwd(), 'uploads', relativePath);

      const imageBuffer = await fs.readFile(fullImagePath);
      log.info('Read image file, performing analysis:', { imageId, path: fullImagePath });

      const analysis = await analyzeImage(imageBuffer);
      log.info('Received analysis from OpenAI:', { imageId, analysis });

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

export async function generateDalleImageHandler(req: Request, res: Response) {
  try {
    log.info('Received DALL-E generation request:', { body: req.body });
    const prompt = dallePromptSchema.parse(req.body);

    const base64Image = await generateDallEImage(
      prompt.prompt,
      prompt.artStyle?.style || "",
      prompt.colors
    );

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', `book-${prompt.bookId || 1}`);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Create a unique filename
    const filename = `dalle_generated_${crypto.randomBytes(8).toString('hex')}.png`;
    const filePath = path.join(uploadsDir, filename);

    // Save the image to the filesystem
    const imageBuffer = Buffer.from(base64Image, 'base64');
    await fs.writeFile(filePath, imageBuffer);

    // Save the image information to the database
    const relativeFilePath = path.join(`book-${prompt.bookId || 1}`, filename);
    const image = await storage.createImage({
      bookId: prompt.bookId || 1,
      path: relativeFilePath,
      selected: true,
      analyzed: false,
      midjourney: {
        prompt: prompt.prompt,
        status: 'completed',
        artStyle: prompt.artStyle?.style || "default"
      }
    });

    log.info('DALL-E image generation completed', { imageId: image.id, path: relativeFilePath });

    res.json({
      id: image.id,
      path: `/uploads/${relativeFilePath}`,
      success: true
    });
  } catch (error) {
    log.error('DALL-E image generation error:', error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid Request',
        details: error.errors
      });
    }

    if (error instanceof OpenAIError) {
      return res.status(error.statusCode || 500).json({
        error: 'AI Image Generation Error',
        message: error.message,
        retry: error.retryable
      });
    }

    res.status(500).json({
      error: 'Failed to generate image',
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