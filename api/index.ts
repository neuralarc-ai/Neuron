import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

// Helper to safely get pathname from request URL
// In Vercel, request.url is often a relative path like "/api/trpc/..."
function getPathname(request: Request): string {
  const urlString = request.url;
  
  // ALWAYS check for relative path first - never call new URL() on relative paths without base
  // Relative paths start with '/' or don't contain '://'
  if (urlString.startsWith('/') || !urlString.includes('://')) {
    // Extract pathname directly from relative path
    const pathEnd = urlString.indexOf('?');
    const pathname = pathEnd > -1 ? urlString.substring(0, pathEnd) : urlString;
    return pathname || '/';
  }
  
  // Only if it's clearly an absolute URL (contains ://), try parsing it
  // This should rarely happen in Vercel, but handle it just in case
  try {
    const url = new URL(urlString);
    return url.pathname;
  } catch {
    // If parsing fails, fall back to manual extraction
    const pathEnd = urlString.indexOf('?');
    const pathStart = urlString.indexOf('/', urlString.indexOf('://') + 3);
    if (pathStart > -1) {
      return pathEnd > -1 ? urlString.substring(pathStart, pathEnd) : urlString.substring(pathStart);
    }
    return '/';
  }
}

export default async function handler(request: Request) {
  // Log the original URL for debugging (truncate to avoid log spam)
  const originalUrl = request.url;
  console.log('[API] Handler called:', request.method, 'URL length:', originalUrl.length, 'starts with /:', originalUrl.startsWith('/'));
  
  const pathname = getPathname(request);
  console.log('[API] Extracted pathname:', pathname);
  
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
      
      // Check if URL is relative (starts with / or doesn't have protocol)
      // In Vercel, request.url is typically a relative path
      if (urlString.startsWith('/') || !urlString.includes('://')) {
        // Reconstruct as absolute URL using Vercel headers
        const host = request.headers.get('host') || 
                     request.headers.get('x-vercel-host') || 
                     request.headers.get('x-forwarded-host') ||
                     request.headers.get('x-real-host') ||
                     'localhost';
        const protocol = request.headers.get('x-forwarded-proto') || 
                         (request.headers.get('x-forwarded-ssl') === 'on' ? 'https' : 'https');
        
        // Use the full original URL string (includes query params)
        // urlString is already the full relative path with query string
        const fullUrl = `${protocol}://${host}${urlString}`;
        
        console.log('[API] Reconstructed URL from relative path:', fullUrl.substring(0, 150));
        
        // Create a new Request with the valid absolute URL
        validRequest = new Request(fullUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          // @ts-ignore - Request constructor accepts these
          signal: request.signal,
        });
      } else {
        // URL appears to be absolute, but validate it
        try {
          // Try to parse it - if it fails, reconstruct
          const testUrl = new URL(urlString);
          // If parsing succeeds, use original request
          validRequest = request;
        } catch (parseError) {
          // If validation fails, reconstruct it
          console.log('[API] Absolute URL parsing failed, reconstructing...');
          const host = request.headers.get('host') || 'localhost';
          const protocol = request.headers.get('x-forwarded-proto') || 'https';
          const fullUrl = `${protocol}://${host}${urlString.startsWith('/') ? urlString : '/' + urlString}`;
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
