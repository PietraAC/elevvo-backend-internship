import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import { databaseReady } from './lib/database.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requestContext } from './middleware/request-context.js';
import { requestLogger } from './middleware/request-logger.js';
import { ProductController } from './modules/products/product.controller.js';
import { ProductRepository } from './modules/products/product.repository.js';
import { ProductService } from './modules/products/product.service.js';
import { getEmbeddingProvider, type EmbeddingProvider } from './modules/search/embedding-provider.js';
import { RedisSearchResultCache, type SearchResultCache } from './modules/search/search-cache.js';
import { SearchController } from './modules/search/search.controller.js';
import { DefaultSemanticSearchService, type SemanticSearchService } from './modules/search/search.service.js';

export interface AppDependencies {
  productRepository?: ProductRepository;
  embeddingProvider?: EmbeddingProvider;
  searchCache?: SearchResultCache;
  searchService?: SemanticSearchService;
  readinessCheck?: () => Promise<boolean>;
}

export function buildApp(dependencies: AppDependencies = {}): Express {
  const app = express();
  const repository = dependencies.productRepository ?? new ProductRepository();
  const embeddings = dependencies.embeddingProvider ?? getEmbeddingProvider();
  const cache = dependencies.searchCache ?? new RedisSearchResultCache();
  const searchService = dependencies.searchService ?? new DefaultSemanticSearchService(repository, embeddings, cache);
  const productService = new ProductService(repository, embeddings);
  const searchController = new SearchController(searchService);
  const productController = new ProductController(repository, productService);
  const demoDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public', 'demo');

  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use(requestContext);
  app.use(requestLogger);

  app.get('/health/live', (_request, response) => {
    response.json({ status: 'UP' });
  });

  app.get('/health/ready', async (_request, response) => {
    const database = dependencies.readinessCheck ? await dependencies.readinessCheck() : await databaseReady();
    const model = embeddings.isReady();
    const ready = database && model;
    response.status(ready ? 200 : 503).json({
      status: ready ? 'READY' : 'NOT_READY',
      checks: { database: database ? 'UP' : 'DOWN', model: model ? 'UP' : 'DOWN', redis: 'OPTIONAL' }
    });
  });

  app.get('/api/products/search', searchController.search);
  app.get('/api/products', productController.list);
  app.get('/api/products/:id', productController.get);
  app.patch('/api/products/:id', productController.update);

  app.use('/demo/assets', express.static(demoDirectory, { index: false, maxAge: '1h' }));
  app.get('/demo', (_request, response) => response.sendFile(path.join(demoDirectory, 'index.html')));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
