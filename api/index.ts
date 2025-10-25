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
      console.log('[API] Handling tRPC request:', url.pathname);
      
      const response = await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: request,
        router: appRouter,
        createContext: async () => {
          try {
            // Create a proper context for Vercel
            const mockReq = {
              method: request.method,
              url: request.url,
              headers: request.headers,
              body: request.body,
              query: Object.fromEntries(url.searchParams),
              session: null, // No session in serverless
            } as any;

            const mockRes = {
              status: () => ({ json: () => {} }),
              json: () => {},
              setHeader: () => {},
              end: () => {},
            } as any;

            return await createContext({ req: mockReq, res: mockRes, info: {} as any });
          } catch (contextError) {
            console.error('[API] Context creation error:', contextError);
            // Return a minimal context if creation fails
            return {
              req: request as any,
              res: {} as any,
              user: null,
            };
          }
        },
        onError: ({ error, path, input }) => {
          console.error(`[tRPC Error] ${path}:`, error);
          console.error(`[tRPC Error] Input:`, input);
        },
      });

      // Add CORS headers to the response
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

      return response;
    } catch (error) {
      console.error('[API Error]', error);
      console.error('[API Error] Stack:', (error as Error).stack);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong',
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

  // Handle other requests
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
