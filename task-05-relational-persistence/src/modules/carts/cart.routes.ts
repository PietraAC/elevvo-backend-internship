import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { cartController } from "./cart.controller.js";
import { orderController } from "../orders/order.controller.js";

export const cartRouter = Router();

cartRouter.get("/users/:userId/cart", asyncHandler(cartController.getByUser));
cartRouter.put("/users/:userId/cart/items/:productId", asyncHandler(cartController.setItem));
cartRouter.delete("/users/:userId/cart/items/:productId", asyncHandler(cartController.removeItem));
cartRouter.post("/users/:userId/checkout", asyncHandler(orderController.checkout));
