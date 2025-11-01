import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

// Helper to safely get pathname from request URL
function getPathname(request: Request): string {
  const urlString = request.url;
  
  // If it's already a relative path (starts with /), extract pathname directly
  if (urlString.startsWith('/')) {
    const pathEnd = urlString.indexOf('?');
    return pathEnd > -1 ? urlString.substring(0, pathEnd) : urlString;
  }
  
  // If it's a full URL, try to parse it
  try {
    const url = new URL(urlString);
    return url.pathname;
  } catch {
    // If that fails, try constructing from headers
    try {
      const host = request.headers.get('host') || 
                   request.headers.get('x-vercel-host') || 
                   'localhost';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const url = new URL(urlString, `${protocol}://${host}`);
      return url.pathname;
    } catch {
      // Last resort: extract pathname manually
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
      // Ensure request.url is a valid absolute URL for fetchRequestHandler
      // In Vercel, request.url is often a relative path, so we need to construct the full URL
      let validRequest = request;
      const urlString = request.url;
      
      // Check if URL is relative (starts with /)
      if (urlString.startsWith('/') || !urlString.includes('://')) {
        // Reconstruct as absolute URL using Vercel headers
        const host = request.headers.get('host') || 
                     request.headers.get('x-vercel-host') || 
                     request.headers.get('x-forwarded-host') ||
                     'localhost';
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        
        // Preserve query string if present
        const queryString = urlString.includes('?') ? urlString.substring(urlString.indexOf('?')) : '';
        const fullUrl = `${protocol}://${host}${pathname}${queryString}`;
        
        console.log('[API] Reconstructed URL:', fullUrl.substring(0, 100));
        
        // Create a new Request with the valid absolute URL
        validRequest = new Request(fullUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
      } else {
        // URL is already absolute, validate it
        try {
          new URL(urlString);
        } catch {
          // If validation fails, reconstruct it
          const host = request.headers.get('host') || 'localhost';
          const protocol = request.headers.get('x-forwarded-proto') || 'https';
          const queryString = urlString.includes('?') ? urlString.substring(urlString.indexOf('?')) : '';
          const fullUrl = `${protocol}://${host}${pathname}${queryString}`;
          validRequest = new Request(fullUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
          });
        }
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
