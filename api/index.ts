import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

export default async function handler(request: Request) {
  console.log('[API] Handler called:', request.method, new URL(request.url).pathname);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Handle tRPC requests
  if (new URL(request.url).pathname.startsWith('/api/trpc')) {
    return fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: async () => {
        // Create context for Vercel environment
        return createContext({
          req: request as any,
          res: undefined,
        });
      },
      onError: ({ error, path }) => {
        console.error(`[tRPC] Error on path "${path}":`, error);
      },
    });
  }

  // Handle health check
  if (new URL(request.url).pathname === '/api/health') {
    return new Response(JSON.stringify({ 
      status: "ok", 
      timestamp: new Date().toISOString() 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Handle other requests
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
