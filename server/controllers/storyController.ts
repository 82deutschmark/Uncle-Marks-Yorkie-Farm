
import { Request, Response } from "express";
import { storage } from "../storage";
import { log } from "../lib/logger";
import { generateStory } from "../lib/openai";
import { insertStorySchema, storyParamsSchema } from "@shared/schema";
import { ZodError } from "zod";
import { OpenAIError } from "../lib/errors";

export async function generateStoryHandler(req: Request, res: Response) {
  try {
    log.info('Raw request body:', req.body);
    const storyParams = storyParamsSchema.parse(req.body);
    log.info('Parameters validated successfully:', storyParams);

    const response = await generateStory(storyParams);

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

    const parsedStory = insertStorySchema.parse(story);
    const savedStory = await storage.createStory(parsedStory);

    log.info('Story saved successfully:', {
      id: savedStory.id,
      title: savedStory.title
    });

    res.json(savedStory);
  } catch (error) {
    const storyParams = req.body;
    
    log.error('Story generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params: storyParams
    });

    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid Parameters',
        message: 'Story parameters validation failed',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }

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
}

export async function getStoryHandler(req: Request, res: Response) {
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
    log.error('Error fetching story:', error);
    res.status(500).json({
      error: 'Failed to fetch story',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
