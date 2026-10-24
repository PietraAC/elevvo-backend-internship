import { createClient } from 'redis';
import { config } from '../config/env.js';
import { logger } from './logger.js';

export type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | undefined;
let warned = false;

export async function getRedisClient(): Promise<RedisClient | undefined> {
  if (!client) {
    client = createClient({
      url: config.REDIS_URL,
      socket: { connectTimeout: 1_000, reconnectStrategy: false }
    });
    client.on('error', () => {
      if (!warned) {
        logger.warn('redis_unavailable', { mode: 'BYPASS' });
        warned = true;
      }
    });
  }

  if (!client.isOpen) {
    try {
      await client.connect();
      warned = false;
    } catch {
      return undefined;
    }
  }

  return client;
}

export async function closeRedis(): Promise<void> {
  if (client?.isOpen) await client.quit();
}
