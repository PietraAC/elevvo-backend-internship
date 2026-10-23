import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { userController } from "./user.controller.js";

export const userRouter = Router();

userRouter.post("/", asyncHandler(userController.create));
userRouter.get("/:id/orders", asyncHandler(userController.listOrders));
userRouter.get("/:id", asyncHandler(userController.getById));
