import { appRouter } from "../server/routers";

// Simple handler that directly processes tRPC requests
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

    // Handle test endpoint
    if (url.pathname === '/api/test') {
      return new Response(JSON.stringify({ 
        message: "API is working!",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
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
      console.log('[API] Processing tRPC request:', url.pathname);
      
      // Import tRPC fetch handler dynamically to avoid issues
      const { fetchRequestHandler } = await import("@trpc/server/adapters/fetch");
      
      const response = await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: request,
        router: appRouter,
        createContext: () => {
          console.log('[API] Creating context');
          return {
            req: request as any,
            res: {} as any,
            user: null,
          };
        },
        onError: ({ error, path, input }) => {
          console.error(`[tRPC Error] ${path}:`, error);
          console.error(`[tRPC Error] Input:`, input);
        },
      });

      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      console.log('[API] tRPC response status:', response.status);
      return response;
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
    console.error('[API] Error stack:', (error as Error).stack);
    
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
