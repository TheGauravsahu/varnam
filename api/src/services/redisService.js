import { createClient } from 'redis';
import 'dotenv/config';

let redisClient = null;
let isRedisConnected = false;

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

if (process.env.NODE_ENV !== 'test') {
  redisClient = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.warn('⚠️ Redis reconnect attempts exceeded. Graceful fallback enabled (in-memory db direct reads).');
          return false; // Stop trying to reconnect
        }
        return Math.min(retries * 200, 2000);
      }
    }
  });

  redisClient.on('connect', () => {
    console.log('🔌 Redis connecting...');
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
    console.log('🚀 Redis cache online and ready!');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err.message);
    isRedisConnected = false;
  });

  redisClient.connect().catch((err) => {
    console.error('⚠️ Redis connection failed to initialize:', err.message);
    isRedisConnected = false;
  });
}

export const redisService = {
  // Read value from Redis cache
  async get(key) {
    if (!isRedisConnected || !redisClient) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`Error reading key ${key} from Redis:`, err.message);
      return null;
    }
  },

  // Write value to Redis cache with TTL
  async set(key, value, expireSeconds = 300) {
    if (!isRedisConnected || !redisClient) return;
    try {
      const stringified = JSON.stringify(value);
      await redisClient.set(key, stringified, {
        EX: expireSeconds
      });
    } catch (err) {
      console.error(`Error writing key ${key} to Redis:`, err.message);
    }
  },

  // Delete key from Redis cache
  async del(key) {
    if (!isRedisConnected || !redisClient) return;
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error(`Error deleting key ${key} from Redis:`, err.message);
    }
  },

  // Delete pattern keys (e.g. cache:dashboard:user:*)
  async delPattern(pattern) {
    if (!isRedisConnected || !redisClient) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      console.error(`Error deleting pattern ${pattern} from Redis:`, err.message);
    }
  }
};
