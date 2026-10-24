import type { NextFunction, Request, Response } from 'express';
import { ProductRepository } from './product.repository.js';
import { paginationSchema, productIdSchema, productUpdateSchema } from './product.schemas.js';
import { ProductService } from './product.service.js';
import type { ProductUpdate } from './product.types.js';

export class ProductController {
  constructor(
    private readonly repository: ProductRepository,
    private readonly service: ProductService
  ) {}

  list = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize } = paginationSchema.parse(request.query);
      const result = await this.repository.list(page, pageSize);
      response.json({
        data: result.products,
        meta: { page, pageSize, total: result.total, pageCount: Math.ceil(result.total / pageSize) }
      });
    } catch (error) {
      next(error);
    }
  };

  get = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const id = productIdSchema.parse(request.params.id);
      response.json({ data: await this.service.get(id) });
    } catch (error) {
      next(error);
    }
  };

  update = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const id = productIdSchema.parse(request.params.id);
      const update = productUpdateSchema.parse(request.body) as ProductUpdate;
      response.json({ data: await this.service.update(id, update) });
    } catch (error) {
      next(error);
    }
  };
}
