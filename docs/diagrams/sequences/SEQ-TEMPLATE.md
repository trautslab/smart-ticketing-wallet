# 📊 [SEQ-XXXX] Diagrama de Secuencia: Flujo de Interacción

**Identificador:** `SEQ-XXXX`  
**Caso de Uso Asociado:** [`UC-XXXX`](../../use-cases/UC-TEMPLATE.md)  
**Dominio:** [Autenticación / Pagos / etc.]  

---

## 1. Diagrama de Secuencia

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuario / Cliente
    participant Gateway as API Gateway / Router
    participant Auth as Auth Middleware
    participant Service as Business Service
    participant Cache as Redis Cache
    participant DB as PostgreSQL DB
    participant Queue as Event Broker (RabbitMQ/Kafka)

    User->>Gateway: POST /api/v1/orders (Payload + Bearer Token)
    Gateway->>Auth: Verificar JWT & Permisos
    alt Token Inválido / Expirado
        Auth-->>Gateway: 401 Unauthorized
        Gateway-->>User: 401 Unauthorized (Error Body)
    else Token Válido
        Auth-->>Gateway: Identity Context (UserId, Roles)
        Gateway->>Service: CreateOrder(UserId, Payload)
        
        Service->>Cache: GET idempotency_key:{id}
        alt Clave en Cache (Petición Duplicada)
            Cache-->>Service: Cached Response
            Service-->>Gateway: 200 OK (Cached Data)
            Gateway-->>User: 200 OK
        else Nueva Petición
            Service->>DB: Iniciar Transacción SQL
            Service->>DB: INSERT INTO orders (...)
            DB-->>Service: Order ID: 9876
            Service->>Cache: SET idempotency_key:{id} (TTL: 24h)
            Service->>Queue: Publish Event: "order.created"
            Service->>DB: COMMIT Transacción
            Service-->>Gateway: 201 Created (OrderDTO)
            Gateway-->>User: 201 Created (JSON Response)
        end
    end
```

## 2. Participantes y Protocolos
| Participante | Tipo | Protocolo / Tecnología |
| :--- | :--- | :--- |
| `API Gateway` | Punto de entrada | HTTP/2, TLS 1.3 |
| `Business Service` | Lógica de Dominio | In-Memory / gRPC |
| `Redis Cache` | Caché e Idempotencia | Redis RESP |
| `PostgreSQL DB` | Persistencia ACID | TCP Socket / SQL |
| `Event Broker` | Asincronía & Eventos | AMQP / Kafka Protocol |
