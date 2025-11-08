import type { Cache, CacheOptions, PutOptions } from '@promethean-os/level-cache';
import { createClient, createClientPool, type RedisClientType, type RedisClientOptions } from 'redis';
import { now, Millis } from '@promethean-os/utils';

export interface RedisCacheConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  socket?: Partial<RedisClientOptions['socket']>;
  connectTimeout?: number;
  commandTimeout?: number;
  maxRetries?: number;
  minPoolSize?: number;
  maxPoolSize?: number;
}

const DEFAULT_CONFIG: Required<Omit<RedisCacheConfig, 'url' | 'password' | 'database' | 'minPoolSize' | 'maxPoolSize'>> = {
  host: 'localhost',
  port: 6379,
  socket: {},
  connectTimeout: 10000,
  commandTimeout: 5000,
  maxRetries: 10,
};

export class RedisCache<T> implements Cache<T> {
  private client: RedisClientType;
  private namespace: string;
  private defaultTtlMs: Millis;
  private isConnected: boolean = false;

  constructor(config: RedisCacheConfig, cacheOptions: CacheOptions = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    this.client = createClient({
      socket: {
        host: finalConfig.host,
        port: finalConfig.port,
        connectTimeout: finalConfig.connectTimeout,
        ...finalConfig.socket,
      },
      password: finalConfig.password,
      database: finalConfig.database,
      commandTimeout: finalConfig.commandTimeout,
      retryStrategy: (retries) => {
        if (retries > (finalConfig.maxRetries || 10)) {
          return false;
        }
        return Math.min(retries * 100, 3000);
      },
    });

    this.namespace = cacheOptions.namespace ?? 'default';
    this.defaultTtlMs = cacheOptions.defaultTtlMs ?? 24 * 60 * 60 * 1000;

    this.client.on('error', (err) => {
      console.error('Redis Cache Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Cache connected');
    });

    this.client.on('reconnecting', () => {
      console.log('Redis Cache reconnecting...');
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

      const parsed = JSON.parse(value);
      return parsed.v !== undefined ? parsed.v : parsed;
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
      
      for await (const key of this.client.scanIterator({
        MATCH: pattern,
        COUNT: 100
      })) {
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
      
      for await (const key of this.client.scanIterator({
        MATCH: pattern,
        COUNT: 100
      })) {
        const value = await this.client.get(key);
        if (value === null) {
          continue;
        }

        const parsed = JSON.parse(value);
        
        // Check for expired entries
        if (parsed.x !== undefined && parsed.x <= now()) {
          await this.client.del(key);
          cleanedCount++;
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Redis sweepExpired error:', error);
      return 0;
    }
  }

  withNamespace(namespace: string): Cache<T> {
    return new RedisCache<T>(
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

export function createRedisCache<T>(config: RedisCacheConfig, cacheOptions?: CacheOptions): RedisCache<T> {
  return new RedisCache<T>(config, cacheOptions);
}