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
  

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
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
