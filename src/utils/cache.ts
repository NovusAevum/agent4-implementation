/**
 * LLM Response Cache with TTL (Time To Live)
 * Reduces API costs and improves response time for repeated prompts
 */

import { logger } from './logger';
import crypto from 'crypto';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class LLMCache<T = string> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: { defaultTTL?: number; maxSize?: number; cleanupIntervalMs?: number } = {}) {
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000; // Maximum 1000 cache entries
    const cleanupIntervalMs = options.cleanupIntervalMs || 60 * 1000; // Cleanup every minute

    // Start automatic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);

    logger.info('LLM Cache initialized', {
      defaultTTL: this.defaultTTL,
      maxSize: this.maxSize,
      cleanupIntervalMs,
    });
  }

  /**
   * Generate cache key from prompt and options
   */
  private generateKey(prompt: string, options?: Record<string, unknown>): string {
    const normalized = {
      prompt: prompt.trim().toLowerCase(),
      options: options || {},
    };
    const hash = crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
    return hash;
  }

  /**
   * Get value from cache
   */
  get(prompt: string, options?: Record<string, unknown>): T | null {
    const key = this.generateKey(prompt, options);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      logger.debug('Cache miss', { prompt: prompt.substring(0, 50) });
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      logger.debug('Cache expired', {
        prompt: prompt.substring(0, 50),
        age: now - entry.timestamp,
      });
      return null;
    }

    // Update hit counter
    entry.hits++;
    this.hits++;
    logger.debug('Cache hit', {
      prompt: prompt.substring(0, 50),
      hits: entry.hits,
      age: now - entry.timestamp,
    });

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(prompt: string, value: T, options?: Record<string, unknown>, ttl?: number): void {
    // Check if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const key = this.generateKey(prompt, options);
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
    };

    this.cache.set(key, entry);
    logger.debug('Cache set', {
      prompt: prompt.substring(0, 50),
      ttl: entry.ttl,
      size: this.cache.size,
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(prompt: string, options?: Record<string, unknown>): boolean {
    return this.get(prompt, options) !== null;
  }

  /**
   * Delete entry from cache
   */
  delete(prompt: string, options?: Record<string, unknown>): boolean {
    const key = this.generateKey(prompt, options);
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache delete', { prompt: prompt.substring(0, 50) });
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    logger.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Cache cleanup', { entriesRemoved: removed, remainingSize: this.cache.size });
    }
  }

  /**
   * Evict oldest entry (LRU-like behavior based on timestamp)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('Cache evicted oldest entry', { size: this.cache.size });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Get all cache entries (for debugging)
   */
  getEntries(): Array<{ key: string; entry: CacheEntry<T> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry,
    }));
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    logger.info('Cache destroyed');
  }
}

/**
 * Singleton cache instance for LLM responses
 */
export const llmCache = new LLMCache<string>({
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxSize: 500, // Store up to 500 responses
  cleanupIntervalMs: 2 * 60 * 1000, // Cleanup every 2 minutes
});
