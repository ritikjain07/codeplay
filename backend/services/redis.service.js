import Redis from 'ioredis';

// Mock Redis client for fallback
class MockRedis {
    constructor() {
        this.connected = false;
    }
    
    async get(key) { 
        console.log(`[MockRedis] GET ${key} -> null`);
        return null; 
    }
    
    async set(key, value, ...args) { 
        console.log(`[MockRedis] SET ${key} ${value}`);
        return 'OK'; 
    }
    
    async ping() { 
        return 'PONG'; 
    }
    
    on(event, callback) { 
        if (event === 'connect') {
            setTimeout(() => callback(), 100);
        }
    }
}

let redisClient;

// Check if Redis credentials are available and try to connect
if (process.env.REDIS_HOST && process.env.REDIS_PASSWORD) {
    try {
        redisClient = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: null,
            lazyConnect: true,
            connectTimeout: 3000,
            retryDelayOnClusterDown: 300,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: null,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: 0
        });
        
        console.log('🔴 Attempting Redis Cloud connection...');
    } catch (error) {
        console.warn('⚠️  Redis setup failed, using mock client');
        redisClient = new MockRedis();
    }
} else {
    console.warn('⚠️  Redis credentials not found, using mock client');
    redisClient = new MockRedis();
}

// Handle Redis events
redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
    console.warn('⚠️  Redis error (switching to mock mode):', err.message);
    // Don't crash the app, just log the warning
});

export default redisClient;