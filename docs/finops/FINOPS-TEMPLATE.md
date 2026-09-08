# 💰 [FINOPS-XXXX] Modelo de Costos, Presupuesto y FinOps

| Campo | Valor / Descripción |
| :--- | :--- |
| **Identificador:** | `FIN-001` (Formato `FIN-XXXX`, inmutable y secuencial) |
| **Objetivo:** | Proyección presupuestaria mensual, desglose de costos fijos/variables y optimización de tokenomics |
| **Audiencia:** | FinOps, Product Owners, CFO, Tech Leads |
| **Diagrama de Despliegue:** | [`DEP-XXXX`](../diagrams/deployment/DEP-TEMPLATE.md) |
| **Matriz de Ambientes:** | [`ENV-MATRIX`](../environments/ENV-MATRIX-TEMPLATE.md) |

---

## 1. Fórmula Maestra del Presupuesto Cloud & AI

El costo operacional total de la plataforma se proyecta mediante la suma de 4 componentes:

$$
\text{Costo Mensual Total} = \text{Cómputo \& Almacenamiento Fijo} + \text{Consumo Elástico Variable} + \text{Inferencia de Agentes IA} + \text{Comisiones Transaccionales}
$$

---

## 2. Bill of Materials (BOM) — Costos Fijos de Infraestructura por Ambiente

| Servicio / Recurso | `DEV` (Local/Cloud) | `QA` (Staging) | `UAT` (Aceptación) | `PROD` (Producción Multi-AZ) | Total Mensual Estimado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cómputo API (ECS / Cloud Run)** | $0 (Local/Docker) | $25 / mes (1 vCPU, 2GB) | $45 / mes (2 vCPU, 4GB) | $180 / mes (Auto-scaling 4-8 pods) | **$250 USD** |
| **Workers Asíncronos & Telemetría** | $0 | $15 / mes | $25 / mes | $80 / mes (2 réplicas dedicadas) | **$120 USD** |
| **Base de Datos (RDS PostgreSQL)** | $0 (Docker) | $35 / mes (db.t4g.small) | $65 / mes (db.t4g.medium) | $240 / mes (db.r6g.large Multi-AZ) | **$340 USD** |
| **Caché en Memoria (Redis Cluster)** | $0 (Docker) | $15 / mes (cache.t4g.micro) | $30 / mes (cache.t4g.small) | $90 / mes (Multi-Node HA) | **$135 USD** |
| **Balanceador de Carga (ALB/Ingress)**| $0 | $18 / mes | $22 / mes | $35 / mes (Incluye LCU de tráfico) | **$75 USD** |
| **WAF & DNS Perimetral (Cloudflare)**| $0 (Free) | $0 (Free) | $20 / mes (Pro) | $200 / mes (Business + Advanced WAF)| **$220 USD** |
| **Secrets Manager & KMS** | $0 | $5 / mes | $5 / mes | $15 / mes (Rotación continua) | **$25 USD** |
| **Subtotal Fijo Mensual:** | **$0 USD** | **$113 USD** | **$212 USD** | **$840 USD** | **$1,165 USD / mes** |

---

## 3. Costos Variables Elásticos (Tráfico, Storage y CDN)

| Recurso Variable | Métrica de Consumo Mensual | Tarifa Unitaria Estimada | Costo Mensual Proyectado |
| :--- | :--- | :--- | :--- |
| **Ancho de Banda Saliente (CDN Egress)** | 1.5 TB / mes | $0.08 / GB | $120.00 USD |
| **Almacenamiento de Objetos (S3 / R2)** | 500 GB (Imágenes y assets de catálogo) | $0.015 / GB | $7.50 USD |
| **Operaciones PUT/GET en Almacenamiento** | 2,000,000 requests / mes | $0.005 / 1,000 ops | $10.00 USD |
| **Subtotal Consumo Variable:** | | | **$137.50 USD / mes** |

---

## 4. Costos de Inferencia de Agentes IA (Tokenomics)

El uso de subagentes autónomos (Antigravity, Claude Code, Codex) genera costos de inferencia durante el ciclo de desarrollo y en features operativas en producción:

| Flujo Agéntico | Tokens Estimados / Mes | Costo sin Optimización | Ahorro con `/frugal-compact` (-38%) | Costo Optimizado Final |
| :--- | :--- | :--- | :--- | :--- |
| **Desarrollo Autónomo & Worktrees** | 15,000,000 tokens | $75.00 USD | -$28.50 USD | $46.50 USD |
| **Baterías de Evals & SWE-bench** | 8,000,000 tokens | $40.00 USD | -$15.20 USD | $24.80 USD |
| **Auditoría de Seguridad Adversarial** | 5,000,000 tokens | $25.00 USD | -$9.50 USD | $15.50 USD |
| **Subtotal Tokenomics IA:** | **28,000,000 tokens** | **$140.00 USD** | **-$53.20 USD (38%)** | **$86.80 USD / mes** |

---

## 5. Costos Transaccionales de Pasarelas de Pago (Stripe)

| Escenario de Ventas | Volumen Bruto Mensual (GMV) | Tarifa Stripe (2.9% + $0.30 USD) | Costo de Pasarela | Margen Neto Recaudado |
| :--- | :--- | :--- | :--- | :--- |
| **Moderado (500 órdenes / mes)** | $25,000 USD | $725.00 + $150.00 | $875.00 USD | $24,125.00 USD (96.5%) |
| **Escala (2,500 órdenes / mes)** | $125,000 USD | $3,625.00 + $750.00 | $4,375.00 USD | $120,625.00 USD (96.5%) |

---

## 6. Resumen Ejecutivo de Presupuesto

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 RESUMEN MENSUAL TOTAL DE OPERACIÓN (Escenario Moderado)                   │
│ • Infraestructura Fija (DEV + QA + UAT + PROD):             $1,165.00 USD  │
│ • Consumo Elástico (CDN, S3, Data Transfer):                  $137.50 USD  │
│ • Inferencia Agéntica IA (con Frugal Engine aplicado):          $86.80 USD  │
│ ─────────────────────────────────────────────────────────────────────────── │
│ 💵 TOTAL OPEX MENSUAL ESTIMADO:                              $1,389.30 USD  │
└─────────────────────────────────────────────────────────────────────────────┘
```
