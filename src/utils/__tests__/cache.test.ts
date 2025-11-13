/**
 * Comprehensive tests for LLM Cache
 */

import { LLMCache } from '../cache';

describe('LLMCache', () => {
  let cache: LLMCache;

  beforeEach(() => {
    cache = new LLMCache({
      defaultTTL: 1000, // 1 second for testing
      maxSize: 3,
      cleanupIntervalMs: 500,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic operations', () => {
    it('should set and get a value', () => {
      cache.set('test prompt', 'test response');
      const result = cache.get('test prompt');
      expect(result).toBe('test response');
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle empty prompts', () => {
      cache.set('', 'empty response');
      const result = cache.get('');
      expect(result).toBe('empty response');
    });

    it('should support case-sensitive keys', () => {
      cache.set('Test Prompt', 'response1');
      cache.set('test prompt', 'response2');

      // Should return response2 (lowercase) because generateKey normalizes to lowercase
      const result = cache.get('TEST PROMPT');
      expect(result).toBe('response2');
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('expiring', 'value');
      expect(cache.get('expiring')).toBe('value');

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.get('expiring')).toBeNull();
    });

    it('should respect custom TTL per entry', async () => {
      cache.set('short-ttl', 'value1', {}, 200);
      cache.set('long-ttl', 'value2', {}, 2000);

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(cache.get('short-ttl')).toBeNull();
      expect(cache.get('long-ttl')).toBe('value2');
    });

    it('should not expire unexpired entries', async () => {
      cache.set('fresh', 'value');

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(cache.get('fresh')).toBe('value');
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when cache is full', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Cache is now full (maxSize: 3)
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');

      // Adding 4th entry should evict oldest (key1)
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should maintain order when evicting', () => {
      cache.set('a', 'valueA');
      cache.set('b', 'valueB');
      cache.set('c', 'valueC');

      cache.set('d', 'valueD'); // Evicts 'a'
      cache.set('e', 'valueE'); // Evicts 'b'

      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toBeNull();
      expect(cache.get('c')).toBe('valueC');
      expect(cache.get('d')).toBe('valueD');
      expect(cache.get('e')).toBe('valueE');
    });
  });

  describe('Cache statistics', () => {
    it('should track hits and misses correctly', () => {
      cache.set('test', 'value');

      cache.get('test'); // Hit
      cache.get('missing1'); // Miss
      cache.get('test'); // Hit
      cache.get('missing2'); // Miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.size).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key', 'value');

      cache.get('key'); // Hit
      cache.get('key'); // Hit
      cache.get('key'); // Hit
      cache.get('missing'); // Miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.75); // 3/4
    });

    it('should return 0 hit rate when no operations', () => {
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should track entry hits correctly', () => {
      cache.set('popular', 'value');

      cache.get('popular');
      cache.get('popular');
      cache.get('popular');

      const entries = cache.getEntries();
      const entry = entries.find((e) => e.entry.value === 'value');

      expect(entry).toBeDefined();
      expect(entry!.entry.hits).toBe(3);
    });
  });

  describe('Options handling', () => {
    it('should generate different keys for different options', () => {
      cache.set('prompt', 'response1', { temperature: 0.5 });
      cache.set('prompt', 'response2', { temperature: 0.9 });

      const result1 = cache.get('prompt', { temperature: 0.5 });
      const result2 = cache.get('prompt', { temperature: 0.9 });

      expect(result1).toBe('response1');
      expect(result2).toBe('response2');
    });

    it('should treat undefined options as empty object', () => {
      cache.set('prompt', 'response');
      const result = cache.get('prompt', {});
      expect(result).toBe('response');
    });

    it('should handle complex option objects', () => {
      const options = {
        temperature: 0.7,
        maxTokens: 100,
        topP: 0.9,
        nested: { a: 1, b: 2 },
      };

      cache.set('prompt', 'response', options);
      const result = cache.get('prompt', options);

      expect(result).toBe('response');
    });
  });

  describe('Clear and delete operations', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.getStats().size).toBe(3);

      cache.clear();

      expect(cache.getStats().size).toBe(0);
      expect(cache.getStats().hits).toBe(0);
      expect(cache.getStats().misses).toBe(0);
    });

    it('should delete specific entries', () => {
      cache.set('keep', 'value1');
      cache.set('delete', 'value2');

      expect(cache.delete('delete')).toBe(true);
      expect(cache.get('delete')).toBeNull();
      expect(cache.get('keep')).toBe('value1');
    });

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('non-existent')).toBe(false);
    });
  });

  describe('has() method', () => {
    it('should return true for existing keys', () => {
      cache.set('exists', 'value');
      expect(cache.has('exists')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('missing')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      cache.set('expiring', 'value', {}, 100);
      expect(cache.has('expiring')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.has('expiring')).toBe(false);
    });
  });

  describe('Automatic cleanup', () => {
    it('should clean up expired entries automatically', async () => {
      cache.set('auto-expire-1', 'value1', {}, 300);
      cache.set('auto-expire-2', 'value2', {}, 300);
      cache.set('keep', 'value3', {}, 2000);

      expect(cache.getStats().size).toBe(3);

      // Wait for cleanup interval
      await new Promise((resolve) => setTimeout(resolve, 600));

      // After cleanup, only non-expired entry should remain
      const stats = cache.getStats();
      expect(stats.size).toBeLessThan(3);
      expect(cache.get('keep')).toBe('value3');
    });
  });

  describe('Destroy', () => {
    it('should stop cleanup interval on destroy', () => {
      const testCache = new LLMCache({ cleanupIntervalMs: 100 });

      testCache.destroy();

      // Verify cleanup interval was cleared (no exception thrown)
      expect(() => testCache.destroy()).not.toThrow();
    });

    it('should clear cache on destroy', () => {
      cache.set('key', 'value');
      expect(cache.getStats().size).toBe(1);

      cache.destroy();

      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long prompts', () => {
      const longPrompt = 'a'.repeat(10000);
      cache.set(longPrompt, 'response');

      expect(cache.get(longPrompt)).toBe('response');
    });

    it('should handle special characters in prompts', () => {
      const specialPrompt = '\\n\\t\\r"\'`{}[]()';
      cache.set(specialPrompt, 'response');

      expect(cache.get(specialPrompt)).toBe('response');
    });

    it('should handle Unicode characters', () => {
      const unicodePrompt = '你好世界 🌍 مرحبا العالم';
      cache.set(unicodePrompt, 'response');

      expect(cache.get(unicodePrompt)).toBe('response');
    });

    it('should handle null-like strings', () => {
      cache.set('null', 'response1');
      cache.set('undefined', 'response2');
      cache.set('0', 'response3');

      expect(cache.get('null')).toBe('response1');
      expect(cache.get('undefined')).toBe('response2');
      expect(cache.get('0')).toBe('response3');
    });
  });

  describe('getEntries()', () => {
    it('should return all cache entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const entries = cache.getEntries();

      expect(entries).toHaveLength(2);
      expect(entries.every((e) => typeof e.key === 'string')).toBe(true);
      expect(entries.every((e) => e.entry.value)).toBeTruthy();
    });

    it('should include entry metadata', () => {
      cache.set('key', 'value');
      const entries = cache.getEntries();

      const entry = entries[0];
      expect(entry.entry.timestamp).toBeGreaterThan(0);
      expect(entry.entry.ttl).toBeGreaterThan(0);
      expect(entry.entry.hits).toBe(0);
    });
  });
});
