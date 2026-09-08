# 🧩 [CMP-XXXX] Diagrama de Componentes e Interfaces

| Campo | Valor / Descripción |
| :--- | :--- |
| **Identificador:** | `CMP-XXXX` (Formato `CMP-XXXX`, inmutable y correlativo) |
| **Subsistema / Dominio:** | [e.g. Núcleo E-Commerce / Gestión de Catálogo y Carrito] |
| **Casos de Uso Asociados:** | [`UC-XXXX`](../../use-cases/UC-TEMPLATE.md) |
| **ADR Relacionado:** | [`ADR-XXXX`](../../adr/ADR-TEMPLATE.md) |
| **Subagentes Responsables:** | `subagent-1` (Catálogo), `subagent-2` (Carrito), `subagent-3` (Órdenes) |

---

## 1. Propósito y Límites de Componentes

Este artefacto modela la descomposición modular de la aplicación, definiendo con precisión las **interfaces públicas (Provided Interfaces)** y las **dependencias consumidas (Required Interfaces)**. 

> [!IMPORTANT]
> **Asignación de Subagentes por Componente:** Para evitar colisiones en Git y bloqueos de archivos en ejecuciones paralelas, cada subagente IA opera exclusivamente sobre el árbol de archivos de su componente en su propio **Git Worktree**.

---

## 2. Diagrama de Componentes UML (Mermaid)

```mermaid
graph TB
    subgraph PRESENTATION["🌐 Capa de Presentación (HTTP / REST Controllers)"]
        CTL_CAT["CatalogController\n(routes/catalog.ts)"]
        CTL_CART["CartController\n(routes/cart.ts)"]
        CTL_ORDER["OrderController\n(routes/order.ts)"]
    end

    subgraph APPLICATION["⚙️ Capa de Aplicación / Servicios (Subagentes Asignados)"]
        subgraph CMP_CATALOG["🧩 Componente Catálogo [subagent-1]"]
            SRV_CAT["CatalogService\n(catalog.service.ts)"]
            PORT_CAT_REPO["«interface»\nICatalogRepository"]
        end

        subgraph CMP_CART["🧩 Componente Carrito [subagent-2]"]
            SRV_CART["CartService\n(cart.service.ts)"]
            PORT_CART_REPO["«interface»\nICartRepository"]
        end

        subgraph CMP_ORDERS["🧩 Componente Órdenes & Pagos [subagent-3]"]
            SRV_ORDER["OrderService\n(order.service.ts)"]
            PORT_PAYMENT["«interface»\nIPaymentGateway"]
            PORT_ORDER_REPO["«interface»\nIOrderRepository"]
        end
    end

    subgraph INFRASTRUCTURE["💾 Capa de Infraestructura & Drivers Externos"]
        REPO_SQL["PostgresCatalogRepository\n(Knex / Drizzle)"]
        REPO_REDIS["RedisCartRepository\n(ioredis L1 Cache)"]
        ADAPTER_STRIPE["StripePaymentAdapter\n(stripe-sdk / MCP)"]
    end

    %% Relaciones de Consumo e Implementación
    CTL_CAT -->|Invoca| SRV_CAT
    CTL_CART -->|Invoca| SRV_CART
    CTL_ORDER -->|Invoca| SRV_ORDER

    SRV_CAT -->|Consume| PORT_CAT_REPO
    REPO_SQL -.->|Implementa| PORT_CAT_REPO

    SRV_CART -->|Consume| PORT_CART_REPO
    REPO_REDIS -.->|Implementa| PORT_CART_REPO

    SRV_ORDER -->|Verifica Stock| SRV_CAT
    SRV_ORDER -->|Lee Carrito| SRV_CART
    SRV_ORDER -->|Procesa Pago| PORT_PAYMENT
    ADAPTER_STRIPE -.->|Implementa| PORT_PAYMENT
```

---

## 3. Matriz de Interfaces y Contratos de Componentes

| Componente | Subagente Dueño | Interfaz Expuesta (Provided) | Dependencia Requerida (Required) | Puerto / Driver |
| :--- | :--- | :--- | :--- | :--- |
| **CatalogComponent** | `subagent-1` | `ICatalogService` (`searchProducts`, `getProductById`) | `ICatalogRepository` | `PostgresCatalogRepository` |
| **CartComponent** | `subagent-2` | `ICartService` (`addItem`, `getCart`, `calculateShipping`) | `ICartRepository` | `RedisCartRepository` (L1) / SQL (L2) |
| **OrderComponent** | `subagent-3` | `IOrderService` (`checkout`, `confirmOrder`) | `IPaymentGateway`, `ICatalogService` | `StripePaymentAdapter` |

---

## 4. Reglas de Aislamiento y No-Colisión

1. **Inyección de Dependencias Estricta:** Ningún componente puede importar implementaciones concretas de la capa `infrastructure`. Solo se comunican a través de las interfaces (`ports/`).
2. **Worktrees Efímeros:** Durante la ejecución autónoma, `subagent-1` trabaja en `.worktrees/subagent-1-catalog/` y `subagent-2` en `.worktrees/subagent-2-cart/`.
3. **Verificación Automatizada:** El guardián determinista `npm run rsi:drift` comprueba que no existan ciclos entre componentes.
