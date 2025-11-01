import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

// Helper to safely get pathname from request URL
function getPathname(request: Request): string {
  try {
    // Try parsing as full URL first
    const url = new URL(request.url);
    return url.pathname;
  } catch {
    // If that fails, try using the URL directly or construct from headers
    try {
      // In Vercel, request.url should be a full URL, but if it's not, use headers
      const host = request.headers.get('host') || 'localhost';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const url = new URL(request.url, `${protocol}://${host}`);
      return url.pathname;
    } catch {
      // Last resort: extract pathname manually
      const urlString = request.url;
      if (urlString.startsWith('/')) {
        const pathEnd = urlString.indexOf('?');
        return pathEnd > -1 ? urlString.substring(0, pathEnd) : urlString;
      }
      return '/';
    }
  }
}

export default async function handler(request: Request) {
  const pathname = getPathname(request);
  console.log('[API] Handler called:', request.method, pathname);
  
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
  if (pathname.startsWith('/api/trpc')) {
    try {
      // Ensure request.url is a valid URL for fetchRequestHandler
      let validRequest = request;
      try {
        // Try to validate the URL - if it fails, we'll reconstruct it
        new URL(request.url);
      } catch {
        // If URL is invalid, reconstruct it using headers
        const host = request.headers.get('host') || request.headers.get('x-vercel-host') || 'localhost';
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const url = `${protocol}://${host}${pathname}${request.url.includes('?') ? request.url.substring(request.url.indexOf('?')) : ''}`;
        // Create a new Request with the valid URL
        validRequest = new Request(url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
      }

      return await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: validRequest,
        router: appRouter,
        createContext: async () => {
          // Create context for Vercel environment
          return createContext({
            req: validRequest as any,
            res: undefined,
          });
        },
        onError: ({ error, path }) => {
          console.error(`[tRPC] Error on path "${path}":`, error);
        },
      });
    } catch (error) {
      console.error('[API] tRPC handler error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  // Handle health check
  if (pathname === '/api/health') {
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
