import type { Request, Response } from "express";
import { parseId } from "../../utils/parse-id.js";
import { createUserSchema, orderListQuerySchema } from "./user.schemas.js";
import { userService } from "./user.service.js";

export const userController = {
  async create(request: Request, response: Response) {
    const input = createUserSchema.parse(request.body);
    const user = await userService.create(input);
    response.status(201).json(user);
  },

  async getById(request: Request, response: Response) {
    const user = await userService.getById(parseId(request.params.id));
    response.status(200).json(user);
  },

  async listOrders(request: Request, response: Response) {
    const userId = parseId(request.params.id);
    const { skip, take } = orderListQuerySchema.parse(request.query);
    const result = await userService.listOrders(userId, skip, take);
    response.status(200).json(result);
  }
};
