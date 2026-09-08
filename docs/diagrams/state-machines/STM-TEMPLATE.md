# 🔀 [STM-XXXX] Diagrama de Estados: Ciclo de Vida de la Entidad

**Identificador:** `STM-XXXX`  
**Entidad Modelada:** `Order` / `UserSession` / `Invoice`  
**Propósito:** Definir los estados válidos, eventos desencadenantes y transiciones permitidas.

---

## 1. Máquina de Estados

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Crear Borrador

    DRAFT --> PENDING_PAYMENT: checkout_initiated
    DRAFT --> CANCELLED: user_abandoned

    PENDING_PAYMENT --> PROCESSING: payment_authorized
    PENDING_PAYMENT --> PAYMENT_FAILED: payment_declined
    PENDING_PAYMENT --> EXPIRED: ttl_timeout_15min

    PAYMENT_FAILED --> PENDING_PAYMENT: retry_payment (intentos < 3)
    PAYMENT_FAILED --> CANCELLED: max_retries_exceeded

    PROCESSING --> COMPLETED: order_fulfilled
    PROCESSING --> REFUNDED: manual_refund_issued

    EXPIRED --> CANCELLED: release_reserved_stock

    COMPLETED --> [*]
    CANCELLED --> [*]
    REFUNDED --> [*]
```

## 2. Matriz de Transición de Estados
| Estado Origen | Evento / Trigger | Estado Destino | Guard / Condición |
| :--- | :--- | :--- | :--- |
| `DRAFT` | `checkout_initiated` | `PENDING_PAYMENT` | Carrito no vacío |
| `PENDING_PAYMENT` | `payment_authorized` | `PROCESSING` | Webhook de pasarela confirmado |
| `PENDING_PAYMENT` | `ttl_timeout` | `EXPIRED` | 15 minutos sin pago |
| `PAYMENT_FAILED` | `retry_payment` | `PENDING_PAYMENT` | Reintentos < 3 |
| `PROCESSING` | `order_fulfilled` | `COMPLETED` | Factura y entrega confirmada |
