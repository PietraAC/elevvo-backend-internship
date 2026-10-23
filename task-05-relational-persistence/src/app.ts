import express from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { requestContext } from "./middleware/request-context.js";
import { userRouter } from "./modules/users/user.routes.js";
import { productRouter } from "./modules/products/product.routes.js";
import { cartRouter } from "./modules/carts/cart.routes.js";
import { orderRouter } from "./modules/orders/order.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(requestContext);

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
  });

  app.use("/api/users", userRouter);
  app.use("/api/products", productRouter);
  app.use("/api", cartRouter);
  app.use("/api/orders", orderRouter);

  app.use((request, response) => {
    response.status(404).json({
      code: "RESOURCE_NOT_FOUND",
      message: "Route not found",
      requestId: request.requestId
    });
  });

  app.use(errorHandler);

  return app;
}
