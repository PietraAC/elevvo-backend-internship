import path from 'node:path';
import { config } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { logger } from '../../lib/logger.js';
import { validateVector } from './vector.js';

export interface EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
  warm(): Promise<void>;
  isReady(): boolean;
}

type FeatureExtractor = (
  text: string,
  options: { pooling: 'mean'; normalize: true }
) => Promise<{ data: Float32Array | number[] }>;

class Semaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active += 1;
    try {
      return await operation();
    } finally {
      this.active -= 1;
      this.queue.shift()?.();
    }
  }
}

export class TransformersEmbeddingProvider implements EmbeddingProvider {
  readonly model = config.EMBEDDING_MODEL;
  readonly dimensions = config.EMBEDDING_DIMENSIONS;
  private pipelinePromise: Promise<FeatureExtractor> | undefined;
  private ready = false;
  private readonly semaphore = new Semaphore(config.EMBEDDING_CONCURRENCY);

  private getPipeline(): Promise<FeatureExtractor> {
    this.pipelinePromise ??= (async () => {
      try {
        const transformers = await import('@huggingface/transformers');
        transformers.env.cacheDir = path.resolve(config.MODEL_CACHE_DIR);
        transformers.env.allowRemoteModels = config.ALLOW_REMOTE_MODELS;
        transformers.env.allowLocalModels = true;

        logger.info('embedding_model_loading', { model: this.model });
        const extractor = await transformers.pipeline('feature-extraction', this.model, {
          dtype: 'q8'
        });
        logger.info('embedding_model_loaded', { model: this.model, dimensions: this.dimensions });
        return extractor as unknown as FeatureExtractor;
      } catch {
        this.pipelinePromise = undefined;
        throw new AppError(503, 'EMBEDDING_UNAVAILABLE', 'The embedding model is unavailable.');
      }
    })();

    return this.pipelinePromise;
  }

  async embed(text: string): Promise<number[]> {
    return this.semaphore.run(async () => {
      const operation = (async () => {
        const extractor = await this.getPipeline();
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        return validateVector(Array.from(output.data), this.dimensions);
      })();

      const timeout = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new AppError(503, 'EMBEDDING_UNAVAILABLE', 'Embedding generation timed out.')),
          config.EMBEDDING_TIMEOUT_MS
        ).unref();
      });

      return Promise.race([operation, timeout]);
    });
  }

  async warm(): Promise<void> {
    await this.embed('A compact product description for model warm-up.');
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }
}

let sharedProvider: TransformersEmbeddingProvider | undefined;

export function getEmbeddingProvider(): TransformersEmbeddingProvider {
  sharedProvider ??= new TransformersEmbeddingProvider();
  return sharedProvider;
}
