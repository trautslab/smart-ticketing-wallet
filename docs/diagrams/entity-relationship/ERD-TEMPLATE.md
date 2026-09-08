# 🗄️ [ERD-XXXX] Diagrama Entidad-Relación: Modelo de Datos

**Identificador:** `ERD-XXXX`  
**Motor de Persistencia:** PostgreSQL 16+  
**Dominio:** [Núcleo de Datos / Facturación / etc.]  

---

## 1. Diagrama Entidad-Relación

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ SESSIONS : has
    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role
        timestamp created_at
        timestamp updated_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        string refresh_token_hash
        string ip_address
        string user_agent
        timestamp expires_at
        timestamp created_at
    }

    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS {
        uuid id PK
        uuid user_id FK
        string status
        decimal total_amount
        string currency
        string idempotency_key UK
        timestamp created_at
        timestamp updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    PRODUCTS ||--o{ ORDER_ITEMS : referenced_in
    PRODUCTS {
        uuid id PK
        string sku UK
        string name
        decimal price
        int stock_quantity
        timestamp created_at
    }
```

## 2. Índices y Restricciones Clave
- `USERS(email)`: Índice único B-Tree.
- `ORDERS(idempotency_key)`: Índice único con filtrado parcial.
- `ORDERS(user_id, created_at DESC)`: Índice compuesto para consultas rápidas de historial.
- `SESSIONS(expires_at)`: Índice para tareas automáticas de limpieza (purge).
