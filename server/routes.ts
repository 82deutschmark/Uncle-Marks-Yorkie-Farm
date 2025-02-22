import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storageClient } from "./lib/object-storage";
import { log } from "./lib/logger";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Basic multer setup for PNG files
  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'image/png') {
        cb(null, true);
      } else {
        cb(new Error('Only PNG files are allowed'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      // Validate file exists
      if (!req.file) {
        log('Upload failed: No file provided');
        return res.status(400).json({ error: 'No file provided' });
      }

      // Log file details
      log('Processing upload:', {
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });

      // Upload to storage
      const key = await storageClient.uploadFile(req.file.buffer, req.file.originalname);
      log('File uploaded successfully with key:', key);

      // Generate URL
      const url = await storageClient.getFileUrl(key);
      log('Generated signed URL for file');

      // Return success
      res.json({ url });

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