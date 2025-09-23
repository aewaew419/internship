import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint for monitoring and load balancers
 * Returns application status and basic metrics
 */

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database?: 'healthy' | 'unhealthy';
    redis?: 'healthy' | 'unhealthy';
    external_api?: 'healthy' | 'unhealthy';
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu?: number;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const startTime = Date.now();
    
    // Basic health checks
    const checks: HealthStatus['checks'] = {};
    let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

    // Check database connection (if applicable)
    try {
      // This would be your actual database health check
      // await checkDatabaseConnection();
      checks.database = 'healthy';
    } catch (error) {
      checks.database = 'unhealthy';
      overallStatus = 'unhealthy';
    }

    // Check Redis connection (if applicable)
    try {
      // This would be your actual Redis health check
      // await checkRedisConnection();
      checks.redis = 'healthy';
    } catch (error) {
      checks.redis = 'unhealthy';
      // Redis might not be critical, so don't mark as unhealthy
    }

    // Check external API connection
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (apiUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        checks.external_api = response.ok ? 'healthy' : 'unhealthy';
        if (!response.ok) {
          overallStatus = 'unhealthy';
        }
      }
    } catch (error) {
      checks.external_api = 'unhealthy';
      overallStatus = 'unhealthy';
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Get uptime
    const uptime = process.uptime();

    // Get version from package.json
    const version = process.env.npm_package_version || '1.0.0';
    const environment = process.env.NODE_ENV || 'development';

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      version,
      environment,
      checks,
      metrics: {
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage * 100) / 100,
        },
      },
    };

    const responseTime = Date.now() - startTime;
    
    // Add response time to headers
    const response = NextResponse.json(healthStatus, {
      status: overallStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Response-Time': `${responseTime}ms`,
      },
    });

    return response;
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Simple health check without detailed response
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}