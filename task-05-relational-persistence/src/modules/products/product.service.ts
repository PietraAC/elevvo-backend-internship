import type { Prisma } from "../../generated/prisma/client.js";
import { notFound } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { normalizeCategory, normalizeSku } from "../../utils/normalization.js";
import { toProductDto } from "./product.mapper.js";
import type {
  CreateProductInput,
  ProductListQuery,
  UpdateProductInput
} from "./product.schemas.js";

export const productService = {
  async create(input: CreateProductInput) {
    const product = await prisma.product.create({
      data: {
        sku: normalizeSku(input.sku),
        name: input.name.trim(),
        description: input.description.trim(),
        category: normalizeCategory(input.category),
        price: input.price,
        stock: input.stock,
        active: input.active
      }
    });

    return toProductDto(product);
  },

  async list(query: ProductListQuery) {
    const where: Prisma.ProductWhereInput = {
      active: query.active ?? true,
      ...(query.category ? { category: normalizeCategory(query.category) } : {}),
      ...(query.inStock === true ? { stock: { gt: 0 } } : {}),
      ...(query.inStock === false ? { stock: 0 } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {})
            }
          }
        : {})
    };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy: { id: "asc" },
        skip: query.skip,
        take: query.take
      }),
      prisma.product.count({ where })
    ]);

    return {
      items: products.map(toProductDto),
      pagination: { skip: query.skip, take: query.take, total }
    };
  },

  async getById(id: number) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw notFound("Product");
    return toProductDto(product);
  },

  async update(id: number, input: UpdateProductInput) {
    const data: Prisma.ProductUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.category !== undefined) data.category = normalizeCategory(input.category);
    if (input.price !== undefined) data.price = input.price;
    if (input.stock !== undefined) data.stock = input.stock;
    if (input.active !== undefined) data.active = input.active;
    const product = await prisma.product.update({ where: { id }, data });
    return toProductDto(product);
  },

  async softDelete(id: number) {
    await prisma.product.update({ where: { id }, data: { active: false } });
  }
};
