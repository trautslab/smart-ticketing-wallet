# 🌍 [ENV-MATRIX] Matriz de Gobernanza de 4 Ambientes (DEV / QA / UAT / PROD)

| Campo | Valor / Descripción |
| :--- | :--- |
| **Identificador:** | `ENV-XXXX` (Formato `ENV-XXXX`, inmutable y correlativo) |
| **Ciclo de Ambientes:** | `DEV` $\rightarrow$ `QA` $\rightarrow$ `UAT` $\rightarrow$ `PROD` |
| **Mecanismo de Secretos:** | AWS Secrets Manager / GCP Secret Manager / Vault / MCP Agent Store |
| **Diagrama de Despliegue:** | [`DEP-XXXX`](../diagrams/deployment/DEP-TEMPLATE.md) |
| **Topología de Red:** | [`SEC-NET-XXXX`](../diagrams/network-topology/SEC-NET-TEMPLATE.md) |

---

## 1. Definición y Propósito de los 4 Ambientes

```mermaid
flowchart LR
    DEV["🛠️ DEV\n(Desarrollo Local / Git Worktrees)"] -->|Gate: precommit:audit| QA["🧪 QA\n(Integración & Fuzzing Automatizado)"]
    QA -->|Gate: rsi:adversarial + Integration OK| UAT["👔 UAT / Staging\n(Aceptación Negocio & BDD)"]
    UAT -->|Gate: rsi:swebench + Sign-off| PROD["🚀 PROD\n(Producción / Multi-AZ HA)"]
```

---

## 2. Matriz Comparativa de Ambientes

| Dimensión | `DEV` (Desarrollo) | `QA` (Calidad & Tests) | `UAT` (Aceptación Negocio) | `PROD` (Producción) |
| :--- | :--- | :--- | :--- | :--- |
| **Objetivo** | Construcción iterativa agéntica | Validación de integración continua | Pruebas de aceptación con clientes | Servicio en vivo para usuarios finales |
| **Audiencia** | Subagentes IA y Programadores | QA Engineers & Pipelines CI/CD | Product Owners & Stakeholders | Clientes y Usuarios Reales |
| **Tipo de Datos** | Fixtures locales / Mocks | Datos sintéticos generados | Copia sanitizada y anonimizada de Prod | Datos reales transaccionales |
| **Infraestructura** | Localhost / Docker / Worktrees | Servidor Cloud económico / Spot | Espejo 1:1 de Prod (Pausable) | Multi-AZ, Réplicas de Lectura, HA |
| **Auto-Escalado** | No (1 réplica) | Mínimo (1-2 réplicas) | Estándar (2 réplicas) | Dinámico (2 - 20 réplicas elásticas) |
| **Observabilidad** | Consola / `events.jsonl` local | Dashboard SSE / Logs agregados | APM / Trazas de rendimiento | Telemetría 24/7, Prometheus, Alertas P0 |

---

## 3. Matriz de Variables de Entorno y Gestión de Secretos

> [!CAUTION]
> **Regla de Cero Fugas:** Ningún secreto de `PROD` o `UAT` puede almacenarse en repositorios Git ni compartirse con los ambientes de desarrollo `DEV` o `QA`.

| Variable de Entorno | `DEV` (`.env.development`) | `QA` (`.env.qa`) | `UAT` (`.env.uat`) | `PROD` (`AWS Secrets / Vault`) |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | `development` | `test` | `staging` | `production` |
| `PORT` | `4000` | `4000` | `4000` | `4000` |
| `DATABASE_URL` | `postgresql://dev:dev@localhost:5432/shopfast_dev` | `postgresql://qa_user:***@qa-db.internal:5432/shopfast_qa` | `postgresql://uat_user:***@uat-db.internal:5432/shopfast_uat` | `postgresql://prod_app:***@prod-db.internal:5432/shopfast_prod` |
| `REDIS_URL` | `redis://localhost:6379/0` | `redis://qa-redis.internal:6379/0` | `redis://uat-redis.internal:6379/0` | `rediss://prod-redis.internal:6379/0` |
| `STRIPE_SECRET_KEY` | `sk_test_mock_dummy_key_001` | `sk_test_51... (Sandbox QA)` | `sk_test_51... (Sandbox UAT)` | `sk_live_51... (Vault KMS Rotativo)` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_mock_dev` | `whsec_qa_test_webhook` | `whsec_uat_test_webhook` | `whsec_live_prod_webhook_kms` |
| `JWT_SECRET` | `dev_jwt_secret_unsafe_32char_min` | `qa_jwt_secret_rotated_dynamically` | `uat_jwt_secret_isolated_key` | `prod_jwt_secret_kms_256_bits` |
| `LOG_LEVEL` | `debug` | `info` | `info` | `warn` / `error` |

---

## 4. Quality Gates Deterministas para la Promoción de Código

### Transición 1: `DEV` $\rightarrow$ `QA`
- **Comando Ejecutor:** `npm run precommit:audit`
- **Criterio de Aprobación:** 100% verde en Typecheck, Cero Secretos en código, 0 violaciones de Clean Architecture, Tests unitarios aprobados.

### Transición 2: `QA` $\rightarrow$ `UAT`
- **Comando Ejecutor:** `npm run rsi:adversarial && npm run rsi:perf`
- **Criterio de Aprobación:** Fuzzing de seguridad sin excepciones `HTTP 500`, Latencia $p95$ dentro de los acuerdos de nivel de servicio (SLAs), 0 regresiones en suites de integración.

### Transición 3: `UAT` $\rightarrow$ `PROD`
- **Comando Ejecutor:** `npm run rsi:swebench && npm run rsi:adr`
- **Criterio de Aprobación:** Escenarios BDD Gherkin aprobados al 100%, Aprobación formal de los Product Owners (Sign-Off), Documentación y ADRs sincronizados.
- **Estrategia de Despliegue:** **Canary Deployment** (10% tráfico inicial $\rightarrow$ monitoreo 15 minutos $\rightarrow$ 100% si error rate $< 0.01\%$) o **Blue/Green** con rollback instantáneo.
