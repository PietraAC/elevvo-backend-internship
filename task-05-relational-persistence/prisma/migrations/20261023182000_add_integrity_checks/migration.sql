-- Domain integrity checks not expressible in Prisma Schema
ALTER TABLE "Product" ADD CONSTRAINT "Product_price_positive" CHECK ("price" > 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_non_negative" CHECK ("stock" >= 0);
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_total_positive" CHECK ("total" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_unitPrice_positive" CHECK ("unitPrice" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_subtotal_positive" CHECK ("subtotal" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_subtotal_matches" CHECK ("subtotal" = "unitPrice" * "quantity");
