/**
 * Metrics collection and monitoring
 * Provides system health and performance metrics
 */

import { llmCache } from './cache';
import { logger } from './logger';

export interface SystemMetrics {
  uptime: number;
  timestamp: string;
  cache: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  process: {
    pid: number;
    cpuUsage: NodeJS.CpuUsage;
    platform: string;
    nodeVersion: string;
  };
}

export interface ProviderMetrics {
  name: string;
  isHealthy: boolean;
  totalRequests: number;
  failedRequests: number;
  successRate: number;
  lastUsed: number | null;
  errorCount: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private startTime: number;

  private constructor() {
    this.startTime = Date.now();
    logger.info('Metrics collector initialized');
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Get system-wide metrics
   *
   * @returns Comprehensive system metrics including:
   *  - uptime: Process uptime in milliseconds
   *  - cache: LLM cache statistics
   *  - memory: Memory usage (heap, RSS) in MB
   *  - process: Node.js process information
   *
   * @example
   * ```ts
   * const metrics = collector.getSystemMetrics();
   * console.log(`Uptime: ${metrics.uptime}ms`);
   * console.log(`Cache hit rate: ${metrics.cache.hitRate}`);
   * ```
   */
  getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const cacheStats = llmCache.getStats();

    return {
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      cache: cacheStats,
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      },
      process: {
        pid: process.pid,
        cpuUsage: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };
  }

  /**
   * Format uptime in human-readable format
   */
  getFormattedUptime(): string {
    const uptime = Date.now() - this.startTime;
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics() {
    return llmCache.getStats();
  }

  /**
   * Clear cache (for testing/maintenance)
   */
  clearCache(): void {
    llmCache.clear();
    logger.info('Cache cleared via metrics API');
  }

  /**
   * Get comprehensive health check with status determination
   *
   * @returns Health status object with:
   *  - status: 'healthy' | 'degraded' | 'unhealthy'
   *  - uptime: Process uptime in milliseconds
   *  - memory: Heap usage percentage
   *  - cache: Cache hit rate percentage
   *
   * @remarks
   * Status levels:
   * - healthy: Normal operation (heap < 80%, cache hit rate > 20%)
   * - degraded: Performance issues (heap > 80% or low cache hit rate)
   * - unhealthy: Critical state (heap > 95%)
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    memory: { heapUsedPercent: number };
    cache: { hitRate: number };
  } {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const cacheStats = llmCache.getStats();

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Degraded if heap > 80% or cache hit rate < 20%
    if (
      heapUsedPercent > 80 ||
      (cacheStats.hitRate < 0.2 && cacheStats.hits + cacheStats.misses > 50)
    ) {
      status = 'degraded';
    }

    // Unhealthy if heap > 95%
    if (heapUsedPercent > 95) {
      status = 'unhealthy';
    }

    return {
      status,
      uptime: Date.now() - this.startTime,
      memory: { heapUsedPercent: Math.round(heapUsedPercent * 100) / 100 },
      cache: { hitRate: Math.round(cacheStats.hitRate * 10000) / 100 },
    };
  }
}

/**
 * Singleton metrics instance
 */
export const metrics = MetricsCollector.getInstance();
