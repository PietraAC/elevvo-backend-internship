import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../errors/app-error.js";
import { normalizeEmail } from "../../utils/normalization.js";
import { toUserDto } from "./user.mapper.js";
import type { CreateUserInput } from "./user.schemas.js";
import { toOrderDto } from "../orders/order.mapper.js";

export const userService = {
  async create(input: CreateUserInput) {
    const user = await prisma.user.create({
      data: {
        email: normalizeEmail(input.email),
        name: input.name.trim(),
        role: input.role,
        cart: { create: {} }
      }
    });

    return toUserDto(user);
  },

  async getById(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw notFound("User");
    return toUserDto(user);
  },

  async listOrders(id: number, skip: number, take: number) {
    const exists = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });
    if (!exists) throw notFound("User");

    const where = { userId: id };
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.order.count({ where })
    ]);

    return {
      items: orders.map(toOrderDto),
      pagination: { skip, take, total }
    };
  }
};
