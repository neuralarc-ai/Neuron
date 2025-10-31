import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer } from "http";
import net from "net";
import session from "express-session";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

// Debug: Log environment variable loading
console.log("[Server] Loading environment variables...");
console.log("[Server] Project root:", projectRoot);
const envResult = dotenv.config({ path: path.join(projectRoot, ".env") });
if (envResult.error) {
  console.error("[Server] ❌ Error loading .env file:", envResult.error);
} else {
  console.log("[Server] ✅ .env file loaded successfully");
}

console.log("[Server] SUPABASE_URL exists:", !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL));
console.log("[Server] SUPABASE_SECRET_KEY exists:", !!(process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_SECRET_KEY));
console.log("[Server] SUPABASE_KEY exists:", !!process.env.SUPABASE_KEY);
console.log("[Server] SUPABASE_SERVICE_ROLE_KEY exists:", !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY));
console.log("[Server] VITE_SUPABASE_URL exists:", !!process.env.VITE_SUPABASE_URL);
console.log("[Server] VITE_SUPABASE_SERVICE_ROLE_KEY exists:", !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const finalUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const finalKey = process.env.SUPABASE_KEY 
  || process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_SECRET_KEY
  || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  || process.env.VITE_SUPABASE_SECRET_KEY;

if (finalUrl) {
  console.log("[Server] Using SUPABASE_URL:", finalUrl.substring(0, 40) + "...");
}
if (finalKey) {
  console.log("[Server] Using Supabase key:", "Found (" + finalKey.substring(0, 20) + "...)");
}

import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";


function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  

  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Session middleware
  app.use(
    session({
      secret: process.env.JWT_SECRET || "neuron-hrms-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
  

  // tRPC API with proper error handling
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: async (opts) => {
        try {
          return await createContext(opts);
        } catch (error) {
          console.error("[tRPC Context] Error creating context:", error);
          // Don't throw here, let tRPC handle it
          throw error;
        }
      },
      onError: ({ error, path, type, ctx, req }) => {
        console.error(`[tRPC] Error on path ${path ?? 'unknown'}:`, error);
        console.error(`[tRPC] Error type: ${type}`);
        console.error(`[tRPC] Error message: ${error.message}`);
        console.error(`[tRPC] Error code: ${error.code}`);
        console.error(`[tRPC] Error stack:`, error.stack);
        
        // Make sure we always return JSON, not HTML
        if (ctx?.res && !ctx.res.headersSent) {
          ctx.res.setHeader('Content-Type', 'application/json');
        }
      },
    })
  );

  // Global error handler for unhandled routes (must be last)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Express] Final error handler:", err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
      });
    }
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
