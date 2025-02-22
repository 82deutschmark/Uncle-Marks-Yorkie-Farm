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

  // Configure multer for handling ZIP uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'application/zip') {
        cb(null, true);
      } else {
        cb(new Error('Only ZIP files are allowed'));
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit for ZIP files
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

      // Process the ZIP file and store images
      const images = await storage.saveUploadedZip(req.file.buffer, bookId);
      log(`Successfully processed ${images.length} images from ZIP`);

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