import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { log } from "./lib/logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log.info(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Enhanced error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error for debugging
    log.error('Error:', {
      status,
      message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });

    // Send error response to client
    res.status(status).json({ message });

    // Only exit for unrecoverable errors
    if (status >= 500 && process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // Setup vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try port 5000 first, fallback to 3000
  const tryPort = async (port: number): Promise<number> => {
    try {
      await new Promise((resolve, reject) => {
        server.listen(port, "0.0.0.0")
          .once('listening', () => resolve(port))
          .once('error', reject);
      });
      return port;
    } catch (err) {
      if (port === 5000) return tryPort(3000);
      throw err;
    }
  };

  tryPort(5000).then(port => {
    log.info(`serving on port ${port}`);
  }).catch(err => {
    log.error('Failed to start server:', err);
    process.exit(1);
  });
})();