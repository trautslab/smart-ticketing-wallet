# 🏛️ Arquitectura del Sistema: Modelo C4

Este documento define la arquitectura estructural del sistema en 3 niveles de abstracción complementarios siguiendo el **Modelo C4**.

---

## Nivel 1: Diagrama de Contexto del Sistema

Describe cómo el sistema interactúa con los usuarios y sistemas externos.

```mermaid
flowchart TD
    UserClient["👤 Usuario Final (Web / Mobile)"]
    AdminUser["👤 Administrador del Sistema"]
    
    subgraph SystemBoundary[" Boundaries del Sistema "]
        CoreSystem["🏢 Nuestro Sistema / Core Platform\n[Node.js / Go / Rust]"]
    end

    PaymentGate["💳 Pasarela de Pagos (Stripe API)"]
    EmailProvider["📧 Proveedor de Correo (SendGrid / AWS SES)"]
    AuthSSO["🔐 Proveedor de Identidad (Google / Auth0)"]

    UserClient -->|HTTPS / REST & WS| CoreSystem
    AdminUser -->|HTTPS / Dashboard| CoreSystem
    CoreSystem -->|REST API| PaymentGate
    CoreSystem -->|SMTP / API| EmailProvider
    CoreSystem -->|OAuth2 / OIDC| AuthSSO
```

---

## Nivel 2: Diagrama de Contenedores

Describe las aplicaciones, microservicios, bases de datos y colas que componen el sistema.

```mermaid
flowchart TB
    ClientSPA["🖥️ Frontend Web (SPA)\n[React / Vue / Svelte]"]
    ClientApp["📱 App Móvil\n[React Native / Flutter]"]

    subgraph Infrastructure[" Red Privada / VPC "]
        Gateway["🚪 API Gateway & Reverse Proxy\n[Traefik / NGINX]"]
        AppServer["⚙️ Core API Service\n[Backend REST & WebSocket]"]
        Worker["⏳ Background Worker\n[Procesamiento Asíncrono]"]
        
        DB[("🗄️ PostgreSQL\n[Persistencia Principal]")]
        Cache[("⚡ Redis Cache\n[Sesiones & Rate Limiting]")]
        Broker["📬 Message Broker\n[RabbitMQ / Redis Streams]"]
    end

    ClientSPA -->|HTTPS| Gateway
    ClientApp -->|HTTPS| Gateway
    Gateway -->|HTTP/2| AppServer

    AppServer -->|SQL TCP| DB
    AppServer -->|RESP| Cache
    AppServer -->|AMQP| Broker

    Broker -->|Consumer| Worker
    Worker -->|SQL TCP| DB
```

---

## Nivel 3: Diagrama de Componentes

Detalla los módulos internos y responsabilidades dentro del `Core API Service`.

```mermaid
flowchart LR
    subgraph CoreAPIService[" Core API Service "]
        direction TB
        Router["HTTP Router / Controllers"]
        AuthMid["Auth & Perms Middleware"]
        ValMid["Validation Middleware (Zod)"]

        subgraph DomainServices[" Capa de Dominio "]
            OrderSvc["OrderService"]
            PaymentSvc["PaymentService"]
            UserSvc["UserService"]
        end

        subgraph Repositories[" Capa de Datos "]
            OrderRepo["OrderRepository"]
            UserRepo["UserRepository"]
        end
    end

    Router --> AuthMid --> ValMid
    ValMid --> OrderSvc
    ValMid --> UserSvc
    OrderSvc --> PaymentSvc
    OrderSvc --> OrderRepo
    UserSvc --> UserRepo
```
