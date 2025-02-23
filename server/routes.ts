import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import express from "express";
import { requestLogger, errorLogger } from "./lib/logger";
import { generateStoryHandler, getStoryHandler } from "./controllers/storyController";
import { uploadImageHandler, analyzeImageHandler, generateImageHandler } from "./controllers/imageController";
import type { Request } from "express";
import { storage } from "./storage";
import { log } from "./lib/logger";
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
import { analyzeImage } from "./lib/openai";


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

  // Story routes
  app.post("/api/stories/generate", generateStoryHandler);
  app.get("/api/stories/:id", getStoryHandler);

  // Image routes
  app.post("/api/upload", upload.single('file'), uploadImageHandler);
  app.post("/api/images/:id/analyze", analyzeImageHandler);
  app.post("/api/images/generate", generateImageHandler);


  app.use(errorLogger);
  return httpServer;
}