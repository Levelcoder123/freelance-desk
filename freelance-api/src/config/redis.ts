import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err: Error) => logger.error('Redis error', err));

export default redis;
