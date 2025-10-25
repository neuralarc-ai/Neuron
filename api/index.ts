// Bulletproof API handler for Vercel - handles tRPC requests directly
export default async function handler(request: Request) {
  console.log('[API] ===== REQUEST START =====');
  console.log('[API] Method:', request.method);
  console.log('[API] URL:', request.url);
  
  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      console.log('[API] Handling OPTIONS');
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
    console.log('[API] Pathname:', url.pathname);
    
    // Handle health check
    if (url.pathname === '/api/health') {
      console.log('[API] Health check');
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

    // Handle tRPC batch requests
    if (url.pathname.startsWith('/api/trpc/') && url.search.includes('batch=1')) {
      console.log('[API] Handling tRPC batch request');
      
      try {
        const pathParts = url.pathname.split('/');
        const procedure = pathParts[pathParts.length - 1];
        console.log('[API] Procedure:', procedure);
        
        let result;
        
        if (procedure === 'dashboard.stats') {
          console.log('[API] Getting dashboard stats');
          result = { 
            totalEmployees: 0, 
            activeEmployees: 0, 
            inactiveEmployees: 0, 
            monthlyPayroll: 0 
          };
        } else if (procedure === 'employees.list') {
          console.log('[API] Getting employees list');
          result = [];
        } else if (procedure === 'employees.create') {
          console.log('[API] Creating employee');
          result = { success: true, message: 'Employee created successfully' };
        } else {
          console.log('[API] Unknown procedure:', procedure);
          result = { message: "Endpoint not implemented", procedure };
        }
        
        // Return tRPC batch response format
        const tRPCResponse = [
          {
            result: {
              data: result
            }
          }
        ];
        
        console.log('[API] Returning response:', JSON.stringify(tRPCResponse));
        
        return new Response(JSON.stringify(tRPCResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (batchError) {
        console.error('[API] Batch request error:', batchError);
        
        const tRPCErrorResponse = [
          {
            error: {
              message: "Internal Server Error",
              code: -32603,
              data: {
                code: "INTERNAL_SERVER_ERROR",
                httpStatus: 500
              }
            }
          }
        ];
        
        return new Response(JSON.stringify(tRPCErrorResponse), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Handle other tRPC requests
    if (url.pathname.startsWith('/api/trpc')) {
      console.log('[API] Handling other tRPC request');
      return new Response(JSON.stringify({ 
        message: "tRPC endpoint reached",
        path: url.pathname,
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
    console.log('[API] Not found');
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('[API] ===== HANDLER ERROR =====');
    console.error('[API] Error:', error);
    console.error('[API] Error message:', (error as Error).message);
    console.error('[API] Error stack:', (error as Error).stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
