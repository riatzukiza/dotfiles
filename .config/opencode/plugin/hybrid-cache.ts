import type { Cache, CacheOptions, PutOptions } from '@promethean-os/level-cache';
import { openLevelCache } from '@promethean-os/level-cache';
import { createRedisCache, type RedisCacheConfig } from './redis-cache';

export type CacheBackend = 'leveldb' | 'redis' | 'hybrid';

export interface HybridCacheConfig {
  backend: CacheBackend;
  redisConfig?: RedisCacheConfig;
  leveldbPath?: string;
  fallbackOnError?: boolean;
}

export class HybridCache<T> implements Cache<T> {
  private levelCache: Cache<T> | undefined;
  private redisCache: Cache<T> | undefined;
  private backend: CacheBackend;
  private fallbackOnError: boolean;
  private currentBackend: CacheBackend;

  constructor(config: HybridCacheConfig, cacheOptions: CacheOptions = {}) {
    this.backend = config.backend;
    this.fallbackOnError = config.fallbackOnError ?? true;
    this.currentBackend = config.backend;

    // Initialize LevelDB if needed
    if (config.backend === 'leveldb' || config.backend === 'hybrid') {
      this.levelCache = openLevelCache<T>({
        path: config.leveldbPath ?? '/tmp/opencode/file-locks',
        namespace: cacheOptions.namespace,
        defaultTtlMs: cacheOptions.defaultTtlMs,
      });
    }

    // Initialize Redis if needed
    if (config.backend === 'redis' || config.backend === 'hybrid') {
      if (!config.redisConfig) {
        throw new Error('Redis configuration is required for Redis backend');
      }
      this.redisCache = createRedisCache<T>(config.redisConfig, cacheOptions);
    }

    if (!this.levelCache && !this.redisCache) {
      throw new Error('At least one cache backend must be configured');
    }
  }

  private getPrimaryCache(): Cache<T> {
    if (this.currentBackend === 'redis' && this.redisCache) {
      return this.redisCache;
    }
    if (this.levelCache) {
      return this.levelCache;
    }
    throw new Error('No available cache backend');
  }

  private getFallbackCache(): Cache<T> | undefined {
    if (this.currentBackend === 'redis' && this.levelCache) {
      return this.levelCache;
    }
    if (this.currentBackend === 'leveldb' && this.redisCache) {
      return this.redisCache;
    }
    return undefined;
  }

  private async executeWithFallback<R>(
    operation: (cache: Cache<T>) => Promise<R>,
    fallback?: (cache: Cache<T>) => Promise<R>
  ): Promise<R> {
    const primaryCache = this.getPrimaryCache();
    
    try {
      return await operation(primaryCache);
    } catch (error) {
      console.error(`Primary cache (${this.currentBackend}) error:`, error);
      
      if (this.fallbackOnError && fallback && this.getFallbackCache()) {
        console.log('Attempting fallback cache...');
        this.currentBackend = this.currentBackend === 'redis' ? 'leveldb' : 'redis';
        
        try {
          const fallbackCache = this.getFallbackCache()!;
          return await fallback(fallbackCache);
        } catch (fallbackError) {
          console.error('Fallback cache error:', fallbackError);
          // Restore original backend and rethrow primary error
          this.currentBackend = this.backend;
          throw error;
        }
      }
      
      throw error;
    }
  }

  async get(key: string): Promise<T | undefined> {
    return this.executeWithFallback(
      (cache) => cache.get(key),
      (fallbackCache) => fallbackCache.get(key)
    );
  }

  async has(key: string): Promise<boolean> {
    return this.executeWithFallback(
      (cache) => cache.has(key),
      (fallbackCache) => fallbackCache.has(key)
    );
  }

  async set(key: string, value: T, options?: PutOptions): Promise<void> {
    await this.executeWithFallback(
      (cache) => cache.set(key, value, options),
      (fallbackCache) => fallbackCache.set(key, value, options)
    );
  }

  async del(key: string): Promise<void> {
    await this.executeWithFallback(
      (cache) => cache.del(key),
      (fallbackCache) => fallbackCache.del(key)
    );
  }

  async batch(ops: Array<{ type: 'set' | 'del'; key: string; value?: T; ttlMs?: Millis }>): Promise<void> {
    await this.executeWithFallback(
      (cache) => cache.batch(ops),
      (fallbackCache) => fallbackCache.batch(ops)
    );
  }

  async *entries(opts: { limit?: number }): AsyncIterable<[string, T]> {
    try {
      const primaryCache = this.getPrimaryCache();
      yield* primaryCache.entries(opts);
    } catch (error) {
      console.error(`Primary cache (${this.currentBackend}) entries error:`, error);
      
      if (this.fallbackOnError && this.getFallbackCache()) {
        console.log('Attempting fallback cache for entries...');
        const fallbackCache = this.getFallbackCache()!;
        yield* fallbackCache.entries(opts);
      } else {
        throw error;
      }
    }
  }

  async sweepExpired(): Promise<number> {
    return this.executeWithFallback(
      (cache) => cache.sweepExpired(),
      (fallbackCache) => fallbackCache.sweepExpired()
    );
  }

  withNamespace(namespace: string): Cache<T> {
    const cacheOptions = {
      namespace,
      defaultTtlMs: this.levelCache ? 5 * 60 * 1000 : undefined, // 5 minutes default
    };

    return new HybridCache<T>({
      backend: this.backend,
      redisConfig: this.redisCache ? {
        // Extract Redis config from existing Redis cache
        url: 'redis://localhost:6379', // Default, should be configurable
      } : undefined,
      leveldbPath: '/tmp/opencode/file-locks', // Default
      fallbackOnError: this.fallbackOnError,
    }, cacheOptions);
  }

  async close(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    if (this.levelCache) {
      promises.push(this.levelCache.close());
    }
    if (this.redisCache) {
      promises.push(this.redisCache.close());
    }
    
    await Promise.all(promises);
  }

  // Hybrid-specific methods
  getCurrentBackend(): CacheBackend {
    return this.currentBackend;
  }

  getOriginalBackend(): CacheBackend {
    return this.backend;
  }

  async switchToBackend(backend: CacheBackend): Promise<void> {
    if (backend === this.currentBackend) {
      return;
    }

    if (backend === 'redis' && !this.redisCache) {
      throw new Error('Redis cache not configured');
    }
    if (backend === 'leveldb' && !this.levelCache) {
      throw new Error('LevelDB cache not configured');
    }

    this.currentBackend = backend;
    console.log(`Switched to ${backend} backend`);
  }

  async healthCheck(): Promise<{
    primary: { backend: CacheBackend; healthy: boolean; error?: string };
    fallback?: { backend: CacheBackend; healthy: boolean; error?: string };
  }> {
    const results: any = {
      primary: { backend: this.currentBackend, healthy: true }
    };

    // Test primary cache
    try {
      const primaryCache = this.getPrimaryCache();
      await primaryCache.has('health-check');
    } catch (error) {
      results.primary.healthy = false;
      results.primary.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test fallback cache if available
    const fallbackCache = this.getFallbackCache();
    if (fallbackCache) {
      results.fallback = { 
        backend: this.currentBackend === 'redis' ? 'leveldb' : 'redis', 
        healthy: true 
      };
      
      try {
        await fallbackCache.has('health-check');
      } catch (error) {
        results.fallback.healthy = false;
        results.fallback.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return results;
  }
}

export function createHybridCache<T>(
  config: HybridCacheConfig,
  cacheOptions?: CacheOptions
): HybridCache<T> {
  return new HybridCache<T>(config, cacheOptions);
}