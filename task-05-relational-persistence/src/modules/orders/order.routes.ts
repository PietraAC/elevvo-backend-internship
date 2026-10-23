import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { orderController } from "./order.controller.js";

export const orderRouter = Router();

orderRouter.get("/:id", asyncHandler(orderController.getById));
