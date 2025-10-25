import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../server/routers.js';
import { createContext } from '../server/_core/context.js';

// Production-ready tRPC API handler for Vercel
export default async function handler(request: Request) {
  console.log('[API] Request received:', request.method, request.url);
  
  try {
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

    const url = new URL(request.url);
    
    // Handle health check
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
      console.log('[API] Handling tRPC request:', url.pathname);
      
      const response = await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: request,
        router: appRouter,
        createContext: () => createContext({ 
          req: request as any, 
          res: {} as any,
          info: {} as any
        }),
        onError: ({ error, path }) => {
          console.error(`[tRPC Error] ${path}:`, error);
        },
      });

      // Add CORS headers to tRPC response
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      
      return new Response(response.body, {
        status: response.status,
        headers: headers,
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

  } catch (error) {
    console.error('[API] Handler error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
