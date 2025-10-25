import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

export default async function handler(request: Request) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      },
    });
  }

  // Handle health check
  const url = new URL(request.url);
  if (url.pathname === '/api/health') {
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

  // Handle tRPC requests
  if (url.pathname.startsWith('/api/trpc')) {
    try {
      const response = await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: request,
        router: appRouter,
        createContext: async () => {
          // Create a mock context for Vercel
          return {
            req: request as any,
            res: {} as any,
            user: null,
          };
        },
        onError: ({ error, path, input }) => {
          console.error(`[tRPC Error] ${path}:`, error);
        },
      });

      // Add CORS headers to the response
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

      return response;
    } catch (error) {
      console.error('[API Error]', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
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
