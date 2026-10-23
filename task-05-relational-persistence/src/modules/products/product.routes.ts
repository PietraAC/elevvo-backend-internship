import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { productController } from "./product.controller.js";

export const productRouter = Router();

productRouter.post("/", asyncHandler(productController.create));
productRouter.get("/", asyncHandler(productController.list));
productRouter.get("/:id", asyncHandler(productController.getById));
productRouter.patch("/:id", asyncHandler(productController.update));
productRouter.delete("/:id", asyncHandler(productController.softDelete));
