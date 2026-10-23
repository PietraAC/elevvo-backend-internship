import type { Request, Response } from "express";
import { parseId } from "../../utils/parse-id.js";
import { setCartItemSchema } from "./cart.schemas.js";
import { cartService } from "./cart.service.js";

export const cartController = {
  async getByUser(request: Request, response: Response) {
    const cart = await cartService.getByUser(parseId(request.params.userId));
    response.status(200).json(cart);
  },

  async setItem(request: Request, response: Response) {
    const { quantity } = setCartItemSchema.parse(request.body);
    const cart = await cartService.setItem(
      parseId(request.params.userId),
      parseId(request.params.productId),
      quantity
    );
    response.status(200).json(cart);
  },

  async removeItem(request: Request, response: Response) {
    await cartService.removeItem(
      parseId(request.params.userId),
      parseId(request.params.productId)
    );
    response.status(204).send();
  }
};
