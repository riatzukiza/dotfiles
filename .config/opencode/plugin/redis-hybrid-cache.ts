import type { Cache, CacheOptions, PutOptions, Millis } from '@promethean-os/level-cache';
import { openLevelCache } from '@promethean-os/level-cache';
import { createClient, type RedisClientType } from 'redis';
import { now } from '@promethean-os/utils';

export type CacheBackend = 'leveldb' | 'redis' | 'hybrid';

export interface RedisCacheConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  socket?: {
    connectTimeout?: number;
  };
  connectTimeout?: number;
  commandTimeout?: number;
}

export interface HybridCacheConfig {
  backend: CacheBackend;
  redisConfig?: RedisCacheConfig;
  leveldbPath?: string;
  fallbackOnError?: boolean;
}

class SimpleRedisCache<T> implements Cache<T> {
  private client: RedisClientType;
  private namespace: string;
  private defaultTtlMs: Millis;
  private isConnected: boolean = false;

  constructor(config: RedisCacheConfig, cacheOptions: CacheOptions = {}) {
    this.client = createClient({
      url: config.url,
      socket: {
        host: config.host || 'localhost',
        port: config.port || 6379,
        connectTimeout: config.connectTimeout || 10000,
        ...config.socket,
      },
      password: config.password,
      database: config.database || 0,
      commandTimeout: config.commandTimeout || 5000,
    });

    this.namespace = cacheOptions.namespace ?? 'default';
    this.defaultTtlMs = cacheOptions.defaultTtlMs ?? 24 * 60 * 60 * 1000;

    this.client.on('error', (err) => {
      console.error('Redis Cache Error:', err);
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }

  private namespacedKey(key: string): string {
    return this.namespace ? `${this.namespace}\u241F${key}` : key;
  }

  async get(key: string): Promise<T | undefined> {
    try {
      await this.ensureConnected();
      const fullKey = this.namespacedKey(key);
      const value = await this.client.get(fullKey);
      
      if (value === null) {
        return undefined;
      }

      try {
        const parsed = JSON.parse(value);
        return parsed.v !== undefined ? parsed.v : parsed;
      } catch {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return undefined;
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  async set(key: string, value: T, options?: PutOptions): Promise<void> {
    try {
      await this.ensureConnected();
      const fullKey = this.namespacedKey(key);
      const ttlMs = options?.ttlMs ?? this.defaultTtlMs;
      const ttlSeconds = Math.floor(ttlMs / 1000);
      
      const envelope = { v: value, x: ttlMs > 0 ? now() + ttlMs : undefined };
      
      if (ttlSeconds > 0) {
        await this.client.setEx(fullKey, ttlSeconds, JSON.stringify(envelope));
      } else {
        await this.client.set(fullKey, JSON.stringify(envelope));
      }
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.ensureConnected();
      const fullKey = this.namespacedKey(key);
      await this.client.del(fullKey);
    } catch (error) {
      console.error(`Redis del error for key ${key}:`, error);
      throw error;
    }
  }

  async batch(ops: Array<{ type: 'set' | 'del'; key: string; value?: T; ttlMs?: Millis }>): Promise<void> {
    try {
      await this.ensureConnected();
      
      const pipeline = this.client.multi();
      
      for (const op of ops) {
        const fullKey = this.namespacedKey(op.key);
        
        if (op.type === 'del') {
          pipeline.del(fullKey);
        } else if (op.type === 'set' && op.value !== undefined) {
          const ttlMs = op.ttlMs ?? this.defaultTtlMs;
          const ttlSeconds = Math.floor(ttlMs / 1000);
          const envelope = { v: op.value, x: ttlMs > 0 ? now() + ttlMs : undefined };
          
          if (ttlSeconds > 0) {
            pipeline.setEx(fullKey, ttlSeconds, JSON.stringify(envelope));
          } else {
            pipeline.set(fullKey, JSON.stringify(envelope));
          }
        }
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Redis batch error:', error);
      throw error;
    }
  }

  async *entries(opts: { limit?: number } = {}): AsyncIterable<[string, T]> {
    try {
      await this.ensureConnected();
      
      const pattern = this.namespace ? `${this.namespace}\u241F*` : '*';
      let count = 0;
      
      const keys = await this.client.keys(pattern);
      
      for (const key of keys) {
        if (opts.limit && count >= opts.limit) {
          break;
        }

        const value = await this.client.get(key);
        if (value === null) {
          continue;
        }

        let logicalKey = key;
        if (this.namespace) {
          const prefix = `${this.namespace}\u241F`;
          if (key.startsWith(prefix)) {
            logicalKey = key.slice(prefix.length);
          }
        }

        try {
          const parsed = JSON.parse(value);
          
          // Check expiration for backwards compatibility
          if (parsed.x !== undefined) {
            if (parsed.x <= now()) {
              await this.client.del(key);
              continue;
            }
            const actualValue = parsed.v !== undefined ? parsed.v : parsed;
            yield [logicalKey, actualValue];
          } else {
            yield [logicalKey, parsed];
          }
        } catch {
          yield [logicalKey, JSON.parse(value)];
        }

        count++;
      }
    } catch (error) {
      console.error('Redis entries error:', error);
      throw error;
    }
  }

  async sweepExpired(): Promise<number> {
    try {
      await this.ensureConnected();
      
      let cleanedCount = 0;
      const pattern = this.namespace ? `${this.namespace}\u241F*` : '*';
      
      const keys = await this.client.keys(pattern);
      
      for (const key of keys) {
        const value = await this.client.get(key);
        if (value === null) {
          continue;
        }

        try {
          const parsed = JSON.parse(value);
          
          // Check for expired entries
          if (parsed.x !== undefined && parsed.x <= now()) {
            await this.client.del(key);
            cleanedCount++;
          }
        } catch {
          // Skip invalid JSON
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Redis sweepExpired error:', error);
      return 0;
    }
  }

  withNamespace(namespace: string): Cache<T> {
    return new SimpleRedisCache<T>(
      { 
        url: this.client.options?.url,
        socket: this.client.options?.socket,
        password: this.client.options?.password,
        database: this.client.options?.database,
      },
      {
        namespace: this.namespace ? `${this.namespace}/${namespace}` : namespace,
        defaultTtlMs: this.defaultTtlMs,
      }
    );
  }

  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export class HybridCache<T> implements Cache<T> {
  private levelCache: Cache<T> | undefined;
  private redisCache: SimpleRedisCache<T> | undefined;
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
      this.redisCache = new SimpleRedisCache<T>(config.redisConfig, cacheOptions);
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
      defaultTtlMs: this.levelCache ? 5 * 60 * 1000 : undefined,
    };

    return new HybridCache<T>({
      backend: this.backend,
      redisConfig: this.redisCache ? {
        host: 'localhost',
        port: 6379,
      } : undefined,
      leveldbPath: '/tmp/opencode/file-locks',
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