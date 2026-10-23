import type { Request, Response } from "express";
import { parseId } from "../../utils/parse-id.js";
import { orderService } from "./order.service.js";

export const orderController = {
  async checkout(request: Request, response: Response) {
    const order = await orderService.checkout(parseId(request.params.userId));
    response.status(201).json(order);
  },

  async getById(request: Request, response: Response) {
    const order = await orderService.getById(parseId(request.params.id));
    response.status(200).json(order);
  }
};
