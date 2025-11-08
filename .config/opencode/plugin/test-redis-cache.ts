import { createHybridCache, type HybridCacheConfig } from './hybrid-cache.js';
import type { LockRecord } from './file-lock.js';

// Test Redis cache functionality
async function testRedisCache() {
  console.log('Testing Redis cache...');

  try {
    // Test Redis backend
    const redisCache = createHybridCache<LockRecord>({
      backend: 'redis',
      redisConfig: {
        host: 'localhost',
        port: 6379,
      },
    }, {
      namespace: 'test-locks',
      defaultTtlMs: 5000,
    });

    console.log('✅ Redis cache created successfully');

    // Test basic operations
    const testRecord: LockRecord = {
      sessionId: 'test-session-123',
      timestamp: Date.now(),
      agentId: 'test-agent',
    };

    // Test set
    await redisCache.set('/test/file.txt', testRecord);
    console.log('✅ Set operation successful');

    // Test get
    const retrieved = await redisCache.get('/test/file.txt');
    if (retrieved && retrieved.sessionId === testRecord.sessionId) {
      console.log('✅ Get operation successful');
    } else {
      console.error('❌ Get operation failed - data mismatch');
      return false;
    }

    // Test has
    const hasRecord = await redisCache.has('/test/file.txt');
    console.log(`✅ Has operation: ${hasRecord}`);

    // Test del
    await redisCache.del('/test/file.txt');
    const deletedRecord = await redisCache.get('/test/file.txt');
    if (!deletedRecord) {
      console.log('✅ Delete operation successful');
    } else {
      console.error('❌ Delete operation failed');
      return false;
    }

    // Test health check
    const health = await redisCache.healthCheck();
    console.log('✅ Health check:', health);

    await redisCache.close();
    console.log('✅ Redis cache closed successfully');
    return true;

  } catch (error) {
    console.error('❌ Redis cache test failed:', error);
    return false;
  }
}

// Test hybrid cache with fallback
async function testHybridCache() {
  console.log('\nTesting Hybrid cache with fallback...');

  try {
    const hybridCache = createHybridCache<LockRecord>({
      backend: 'hybrid',
      redisConfig: {
        host: 'localhost',
        port: 6379,
      },
      leveldbPath: '/tmp/hybrid-test-locks',
      fallbackOnError: true,
    }, {
      namespace: 'test-hybrid-locks',
      defaultTtlMs: 5000,
    });

    console.log('✅ Hybrid cache created successfully');

    // Test current backend
    console.log(`Current backend: ${hybridCache.getCurrentBackend()}`);

    // Test operations
    const testRecord: LockRecord = {
      sessionId: 'hybrid-test-session',
      timestamp: Date.now(),
      agentId: 'hybrid-agent',
    };

    await hybridCache.set('/test/hybrid/file.txt', testRecord);
    const retrieved = await hybridCache.get('/test/hybrid/file.txt');
    
    if (retrieved && retrieved.sessionId === testRecord.sessionId) {
      console.log('✅ Hybrid cache operations successful');
    } else {
      console.error('❌ Hybrid cache operations failed');
      return false;
    }

    // Test backend switching
    const originalBackend = hybridCache.getCurrentBackend();
    await hybridCache.switchToBackend('leveldb');
    console.log(`✅ Switched to ${hybridCache.getCurrentBackend()} backend`);

    await hybridCache.switchToBackend('redis');
    console.log(`✅ Switched back to ${hybridCache.getCurrentBackend()} backend`);

    // Test health check
    const health = await hybridCache.healthCheck();
    console.log('✅ Hybrid health check:', health);

    await hybridCache.close();
    console.log('✅ Hybrid cache closed successfully');
    return true;

  } catch (error) {
    console.error('❌ Hybrid cache test failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Redis cache tests...\n');

  const redisTest = await testRedisCache();
  const hybridTest = await testHybridCache();

  console.log('\n📊 Test Results:');
  console.log(`Redis Cache: ${redisTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Hybrid Cache: ${hybridTest ? '✅ PASSED' : '❌ FAILED'}`);

  if (redisTest && hybridTest) {
    console.log('\n🎉 All tests passed! Redis cache is ready for integration.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}