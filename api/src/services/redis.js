import { createClient } from 'redis';
import 'dotenv/config';

if (!process.env.REDIS_URL) {
  throw new Error('❌ REDIS_URL is missing in your .env. Please configure your Upstash Redis connection string.');
}

const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Connection Error:', err.message);
});

await redisClient.connect();
console.log('✅ Connected to Upstash Redis');

export { redisClient };
export default redisClient;
