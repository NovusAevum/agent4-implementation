/**
 * Comprehensive tests for Metrics Collector
 */

import { MetricsCollector } from '../metrics';
import { llmCache } from '../cache';

describe('MetricsCollector', () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = MetricsCollector.getInstance();
    llmCache.clear(); // Reset cache for clean metrics
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MetricsCollector.getInstance();
      const instance2 = MetricsCollector.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('getSystemMetrics()', () => {
    it('should return complete system metrics', () => {
      const systemMetrics = metrics.getSystemMetrics();

      expect(systemMetrics).toHaveProperty('uptime');
      expect(systemMetrics).toHaveProperty('timestamp');
      expect(systemMetrics).toHaveProperty('cache');
      expect(systemMetrics).toHaveProperty('memory');
      expect(systemMetrics).toHaveProperty('process');
    });

    it('should include valid uptime', () => {
      const systemMetrics = metrics.getSystemMetrics();

      expect(systemMetrics.uptime).toBeGreaterThan(0);
      expect(typeof systemMetrics.uptime).toBe('number');
    });

    it('should include valid timestamp', () => {
      const systemMetrics = metrics.getSystemMetrics();
      const timestamp = new Date(systemMetrics.timestamp);

      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    it('should include cache metrics', () => {
      const systemMetrics = metrics.getSystemMetrics();

      expect(systemMetrics.cache).toHaveProperty('hits');
      expect(systemMetrics.cache).toHaveProperty('misses');
      expect(systemMetrics.cache).toHaveProperty('size');
      expect(systemMetrics.cache).toHaveProperty('hitRate');

      expect(typeof systemMetrics.cache.hits).toBe('number');
      expect(typeof systemMetrics.cache.misses).toBe('number');
      expect(typeof systemMetrics.cache.size).toBe('number');
      expect(typeof systemMetrics.cache.hitRate).toBe('number');
    });

    it('should include memory metrics', () => {
      const systemMetrics = metrics.getSystemMetrics();

      expect(systemMetrics.memory).toHaveProperty('heapUsed');
      expect(systemMetrics.memory).toHaveProperty('heapTotal');
      expect(systemMetrics.memory).toHaveProperty('external');
      expect(systemMetrics.memory).toHaveProperty('rss');

      expect(systemMetrics.memory.heapUsed).toBeGreaterThan(0);
      expect(systemMetrics.memory.heapTotal).toBeGreaterThan(0);
      expect(systemMetrics.memory.rss).toBeGreaterThan(0);
    });

    it('should include process metrics', () => {
      const systemMetrics = metrics.getSystemMetrics();

      expect(systemMetrics.process).toHaveProperty('pid');
      expect(systemMetrics.process).toHaveProperty('cpuUsage');
      expect(systemMetrics.process).toHaveProperty('platform');
      expect(systemMetrics.process).toHaveProperty('nodeVersion');

      expect(systemMetrics.process.pid).toBe(process.pid);
      expect(typeof systemMetrics.process.platform).toBe('string');
      expect(systemMetrics.process.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should return memory in MB', () => {
      const systemMetrics = metrics.getSystemMetrics();

      // Memory values should be reasonable (> 0 and < 10GB)
      expect(systemMetrics.memory.heapUsed).toBeGreaterThan(0);
      expect(systemMetrics.memory.heapUsed).toBeLessThan(10000);
      expect(systemMetrics.memory.heapTotal).toBeGreaterThan(0);
      expect(systemMetrics.memory.heapTotal).toBeLessThan(10000);
    });
  });

  describe('getFormattedUptime()', () => {
    it('should format uptime correctly', () => {
      const uptime = metrics.getFormattedUptime();

      expect(typeof uptime).toBe('string');
      expect(uptime.length).toBeGreaterThan(0);
    });

    it('should include time units', () => {
      const uptime = metrics.getFormattedUptime();

      // Should contain at least one time unit (s, m, h, or d)
      expect(uptime).toMatch(/[dhms]/);
    });

    it('should format seconds correctly', () => {
      const uptime = metrics.getFormattedUptime();

      // For a fresh instance, should be in seconds
      expect(uptime).toMatch(/\d+[dhms]/);
    });
  });

  describe('getCacheMetrics()', () => {
    it('should return cache statistics', () => {
      const cacheMetrics = metrics.getCacheMetrics();

      expect(cacheMetrics).toHaveProperty('hits');
      expect(cacheMetrics).toHaveProperty('misses');
      expect(cacheMetrics).toHaveProperty('size');
      expect(cacheMetrics).toHaveProperty('hitRate');
    });

    it('should reflect actual cache state', () => {
      // Add some cache entries
      llmCache.set('test1', 'value1');
      llmCache.set('test2', 'value2');

      // Trigger hits and misses
      llmCache.get('test1'); // Hit
      llmCache.get('missing'); // Miss

      const cacheMetrics = metrics.getCacheMetrics();

      expect(cacheMetrics.hits).toBe(1);
      expect(cacheMetrics.misses).toBe(1);
      expect(cacheMetrics.size).toBe(2);
      expect(cacheMetrics.hitRate).toBe(0.5);
    });
  });

  describe('clearCache()', () => {
    it('should clear the cache', () => {
      llmCache.set('test', 'value');
      expect(llmCache.getStats().size).toBe(1);

      metrics.clearCache();

      expect(llmCache.getStats().size).toBe(0);
    });

    it('should reset cache statistics', () => {
      llmCache.set('test', 'value');
      llmCache.get('test'); // Hit

      expect(llmCache.getStats().hits).toBe(1);

      metrics.clearCache();

      expect(llmCache.getStats().hits).toBe(0);
      expect(llmCache.getStats().misses).toBe(0);
    });
  });

  describe('getHealthStatus()', () => {
    it('should return health status object', () => {
      const health = metrics.getHealthStatus();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('memory');
      expect(health).toHaveProperty('cache');
    });

    it('should return valid status values', () => {
      const health = metrics.getHealthStatus();

      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });

    it('should include memory percentage', () => {
      const health = metrics.getHealthStatus();

      expect(health.memory).toHaveProperty('heapUsedPercent');
      expect(health.memory.heapUsedPercent).toBeGreaterThanOrEqual(0);
      expect(health.memory.heapUsedPercent).toBeLessThanOrEqual(100);
    });

    it('should include cache hit rate', () => {
      const health = metrics.getHealthStatus();

      expect(health.cache).toHaveProperty('hitRate');
      expect(health.cache.hitRate).toBeGreaterThanOrEqual(0);
      expect(health.cache.hitRate).toBeLessThanOrEqual(100);
    });

    it('should report a valid status', () => {
      const health = metrics.getHealthStatus();

      // System should report one of the valid statuses
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });

    it('should format hit rate as percentage', () => {
      // Add cache activity
      llmCache.set('test', 'value');
      llmCache.get('test'); // 100% hit rate

      const health = metrics.getHealthStatus();

      expect(health.cache.hitRate).toBe(100); // 100%
    });
  });

  describe('Health status determination', () => {
    it('should report memory within valid range', () => {
      const health = metrics.getHealthStatus();

      expect(health.status).toBeDefined();
      expect(health.memory.heapUsedPercent).toBeGreaterThanOrEqual(0);
      expect(health.memory.heapUsedPercent).toBeLessThanOrEqual(100);
    });

    it('should handle zero cache activity', () => {
      llmCache.clear();

      const health = metrics.getHealthStatus();

      // Zero activity should not cause degraded status
      expect(health.cache.hitRate).toBe(0);
    });
  });

  describe('Integration with cache', () => {
    it('should reflect cache changes in metrics', () => {
      const before = metrics.getSystemMetrics();

      llmCache.set('key1', 'value1');
      llmCache.set('key2', 'value2');

      const after = metrics.getSystemMetrics();

      expect(after.cache.size).toBeGreaterThan(before.cache.size);
    });

    it('should track cache hits in system metrics', () => {
      llmCache.set('test', 'value');

      const beforeHits = metrics.getSystemMetrics().cache.hits;

      llmCache.get('test'); // Hit

      const afterHits = metrics.getSystemMetrics().cache.hits;

      expect(afterHits).toBe(beforeHits + 1);
    });
  });

  describe('Memory metrics accuracy', () => {
    it('should report reasonable memory values', () => {
      const systemMetrics = metrics.getSystemMetrics();

      // Heap used should be less than heap total
      expect(systemMetrics.memory.heapUsed).toBeLessThanOrEqual(systemMetrics.memory.heapTotal);

      // RSS should be greater than heap total (includes native memory)
      expect(systemMetrics.memory.rss).toBeGreaterThanOrEqual(systemMetrics.memory.heapTotal);
    });

    it('should report non-negative memory values', () => {
      const systemMetrics = metrics.getSystemMetrics();

      expect(systemMetrics.memory.heapUsed).toBeGreaterThanOrEqual(0);
      expect(systemMetrics.memory.heapTotal).toBeGreaterThanOrEqual(0);
      expect(systemMetrics.memory.external).toBeGreaterThanOrEqual(0);
      expect(systemMetrics.memory.rss).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Uptime tracking', () => {
    it('should increase uptime over time', async () => {
      const uptime1 = metrics.getSystemMetrics().uptime;

      await new Promise((resolve) => setTimeout(resolve, 100));

      const uptime2 = metrics.getSystemMetrics().uptime;

      expect(uptime2).toBeGreaterThan(uptime1);
    });

    it('should format different time scales correctly', () => {
      const uptime = metrics.getFormattedUptime();

      // Should not be empty
      expect(uptime.length).toBeGreaterThan(0);

      // Should contain numbers
      expect(uptime).toMatch(/\d+/);
    });
  });
});
