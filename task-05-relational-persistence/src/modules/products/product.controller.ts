import type { Request, Response } from "express";
import { parseId } from "../../utils/parse-id.js";
import {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema
} from "./product.schemas.js";
import { productService } from "./product.service.js";

export const productController = {
  async create(request: Request, response: Response) {
    const product = await productService.create(createProductSchema.parse(request.body));
    response.status(201).json(product);
  },

  async list(request: Request, response: Response) {
    const result = await productService.list(productListQuerySchema.parse(request.query));
    response.status(200).json(result);
  },

  async getById(request: Request, response: Response) {
    const product = await productService.getById(parseId(request.params.id));
    response.status(200).json(product);
  },

  async update(request: Request, response: Response) {
    const product = await productService.update(
      parseId(request.params.id),
      updateProductSchema.parse(request.body)
    );
    response.status(200).json(product);
  },

  async softDelete(request: Request, response: Response) {
    await productService.softDelete(parseId(request.params.id));
    response.status(204).send();
  }
};
