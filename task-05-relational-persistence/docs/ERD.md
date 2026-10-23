# Relational Model

```mermaid
erDiagram
    USER ||--|| CART : owns
    USER ||--o{ ORDER : places
    CART ||--o{ CART_ITEM : contains
    PRODUCT ||--o{ CART_ITEM : selected_as
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : purchased_as

    USER {
        int id PK
        string email UK
        string name
        Role role
    }
    PRODUCT {
        int id PK
        string sku UK
        string name
        decimal price
        int stock
        boolean active
    }
    CART {
        int id PK
        int userId FK,UK
    }
    CART_ITEM {
        int id PK
        int cartId FK
        int productId FK
        int quantity
    }
    ORDER {
        int id PK
        int userId FK
        OrderStatus status
        decimal total
    }
    ORDER_ITEM {
        int id PK
        int orderId FK
        int productId FK
        string productName
        decimal unitPrice
        int quantity
        decimal subtotal
    }
```

## Integrity decisions

- `OrderItem` materializes the many-to-many relationship between orders and
  products.
- Product name and price are copied into `OrderItem` to preserve order history.
- Products are deactivated instead of physically deleted.
- A cart does not reserve stock; final validation occurs during checkout.
- PostgreSQL constraints prevent non-positive prices and quantities and prevent
  negative stock.

