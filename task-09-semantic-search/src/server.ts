import { config } from './config/env.js';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { buildApp } from './app.js';
import { closeDatabase } from './lib/database.js';
import { logger } from './lib/logger.js';
import { closeRedis } from './lib/redis.js';
import { getEmbeddingProvider } from './modules/search/embedding-provider.js';

async function start(): Promise<void> {
  const embeddings = getEmbeddingProvider();
  await embeddings.warm();
  const app = buildApp({ embeddingProvider: embeddings });
  const pidFile = path.resolve('.task09-api.pid');
  await writeFile(pidFile, String(process.pid), 'utf8');
  const server = app.listen(config.PORT, () => {
    logger.info('server_started', {
      port: config.PORT,
      model: embeddings.model,
      demo: `http://localhost:${config.PORT}/demo`
    });
  });

  const shutdown = async (signal: string) => {
    logger.info('server_stopping', { signal });
    server.close(async () => {
      await unlink(pidFile).catch(() => undefined);
      await Promise.allSettled([closeRedis(), closeDatabase()]);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

start().catch(() => {
  logger.error('server_start_failed', { code: 'STARTUP_ERROR' });
  process.exit(1);
});
