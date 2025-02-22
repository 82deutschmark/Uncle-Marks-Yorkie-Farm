import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import express from "express";
import { storage } from "./storage";
import { log } from "./lib/logger";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Configure multer without restrictions
  const upload = multer({
    storage: multer.memoryStorage()
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