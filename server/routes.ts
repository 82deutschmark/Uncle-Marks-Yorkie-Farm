import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storageClient } from "./lib/object-storage";
import { log } from "./lib/logger";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Configure multer for handling PNG uploads
  const uploadPng = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'image/png') {
        cb(null, true);
        return;
      }
      cb(new Error('Only PNG files are allowed'));
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  app.post("/api/upload", uploadPng.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        log('No file provided in request');
        return res.status(400).json({ message: "No file provided" });
      }

      log('Starting file upload process...');
      log('File details:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const key = await storageClient.uploadFile(
        req.file.buffer,
        req.file.originalname
      );
      log('File uploaded to storage, key:', key);

      const url = await storageClient.getFileUrl(key);
      log('Generated signed URL:', url);

      res.json({
        message: "File uploaded successfully",
        url
      });
    } catch (error) {
      log('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      res.status(500).json({ message });
    }
  });

  return httpServer;
}