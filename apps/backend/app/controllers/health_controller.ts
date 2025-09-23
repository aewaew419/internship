import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class HealthController {
  /**
   * Health check endpoint for monitoring and load balancers
   * GET /api/v1/health
   */
  async index({ response }: HttpContext) {
    const startTime = Date.now()
    
    try {
      // Check database connection
      const dbHealth = await this.checkDatabase()
      
      // Get system metrics
      const metrics = this.getSystemMetrics()
      
      // Calculate response time
      const responseTime = Date.now() - startTime
      
      const healthData = {
        status: dbHealth.healthy ? 'healthy' : 'unhealthy',
        timestamp: DateTime.now().toISO(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: dbHealth.status,
          memory: metrics.memory.status,
          disk: 'healthy', // TODO: Implement disk check
        },
        metrics: {
          responseTime,
          memory: metrics.memory,
          database: dbHealth.metrics,
        },
        services: {
          database: {
            status: dbHealth.status,
            responseTime: dbHealth.responseTime,
            connections: dbHealth.connections,
          },
        },
      }

      const statusCode = healthData.status === 'healthy' ? 200 : 503
      
      return response
        .status(statusCode)
        .header('Cache-Control', 'no-cache, no-store, must-revalidate')
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .header('X-Response-Time', `${responseTime}ms`)
        .json(healthData)
        
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return response
        .status(503)
        .header('Cache-Control', 'no-cache, no-store, must-revalidate')
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .header('X-Response-Time', `${responseTime}ms`)
        .json({
          status: 'unhealthy',
          timestamp: DateTime.now().toISO(),
          error: 'Health check failed',
          message: error.message,
          responseTime,
        })
    }
  }

  /**
   * Simple health check for HEAD requests (load balancers)
   * HEAD /api/v1/health
   */
  async head({ response }: HttpContext) {
    try {
      // Quick database ping
      await db.rawQuery('SELECT 1')
      
      return response
        .status(200)
        .header('Cache-Control', 'no-cache, no-store, must-revalidate')
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .send('')
        
    } catch (error) {
      return response.status(503).send('')
    }
  }

  /**
   * Detailed health check with more comprehensive tests
   * GET /api/v1/health/detailed
   */
  async detailed({ response }: HttpContext) {
    const startTime = Date.now()
    
    try {
      // Comprehensive checks
      const [dbHealth, diskHealth, externalServices] = await Promise.all([
        this.checkDatabase(),
        this.checkDiskSpace(),
        this.checkExternalServices(),
      ])
      
      const metrics = this.getSystemMetrics()
      const responseTime = Date.now() - startTime
      
      const allHealthy = dbHealth.healthy && diskHealth.healthy && externalServices.healthy
      
      const healthData = {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: DateTime.now().toISO(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: dbHealth.status,
          disk: diskHealth.status,
          memory: metrics.memory.status,
          externalServices: externalServices.status,
        },
        metrics: {
          responseTime,
          memory: metrics.memory,
          database: dbHealth.metrics,
          disk: diskHealth.metrics,
        },
        services: {
          database: {
            status: dbHealth.status,
            responseTime: dbHealth.responseTime,
            connections: dbHealth.connections,
          },
          externalServices: externalServices.services,
        },
        dependencies: {
          nodejs: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      }

      const statusCode = healthData.status === 'healthy' ? 200 : 503
      
      return response
        .status(statusCode)
        .header('Cache-Control', 'no-cache, no-store, must-revalidate')
        .header('X-Response-Time', `${responseTime}ms`)
        .json(healthData)
        
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return response
        .status(503)
        .header('X-Response-Time', `${responseTime}ms`)
        .json({
          status: 'unhealthy',
          timestamp: DateTime.now().toISO(),
          error: 'Detailed health check failed',
          message: error.message,
          responseTime,
        })
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase() {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      await db.rawQuery('SELECT 1')
      
      // Test write capability (if needed)
      // await db.rawQuery('SELECT 1 FROM users LIMIT 1')
      
      const responseTime = Date.now() - startTime
      
      // Get connection pool info (if available)
      const connections = {
        active: 0, // TODO: Get actual connection count
        idle: 0,
        total: 0,
      }
      
      return {
        healthy: true,
        status: 'healthy',
        responseTime,
        connections,
        metrics: {
          queryTime: responseTime,
          connectionPool: connections,
        },
      }
    } catch (error) {
      return {
        healthy: false,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        connections: null,
        metrics: null,
      }
    }
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace() {
    try {
      // TODO: Implement actual disk space check
      // For now, return healthy
      return {
        healthy: true,
        status: 'healthy',
        metrics: {
          total: 0,
          used: 0,
          free: 0,
          percentage: 0,
        },
      }
    } catch (error) {
      return {
        healthy: false,
        status: 'unhealthy',
        error: error.message,
        metrics: null,
      }
    }
  }

  /**
   * Check external services
   */
  private async checkExternalServices() {
    try {
      // TODO: Check external services like Redis, file storage, etc.
      return {
        healthy: true,
        status: 'healthy',
        services: {
          redis: 'not_configured',
          storage: 'not_configured',
          email: 'not_configured',
        },
      }
    } catch (error) {
      return {
        healthy: false,
        status: 'unhealthy',
        error: error.message,
        services: null,
      }
    }
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics() {
    const memoryUsage = process.memoryUsage()
    const totalMemory = memoryUsage.heapTotal
    const usedMemory = memoryUsage.heapUsed
    const memoryPercentage = (usedMemory / totalMemory) * 100
    
    return {
      memory: {
        status: memoryPercentage > 90 ? 'warning' : 'healthy',
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage * 100) / 100,
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
    }
  }
}