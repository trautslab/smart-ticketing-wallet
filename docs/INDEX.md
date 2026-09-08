# 🗺️ Índice Maestro de Documentación & Trazabilidad

Este índice actúa como la **matriz de navegación** para todo el catálogo de arquitectura, casos de uso y diagramas del repositorio.

---

## 🏛️ 1. Arquitectura Global
- [Modelo C4 (Contexto, Contenedores, Componentes)](architecture/c4-model-TEMPLATE.md)
- [Decisiones de Arquitectura (ADRs)](adr/ADR-TEMPLATE.md)

---

## 🔬 1.1. Análisis Profundo & Arquitectura Enterprise (Framework Central)
- [01-ENTERPRISE-NFRS-AND-ISOLATION-100-TOOLS.md](https://github.com/trautslab/ai-sdlc-framework/blob/main/docs/deep-dives/01-ENTERPRISE-NFRS-AND-ISOLATION-100-TOOLS.md) — Matriz de RNFs, Resiliencia, Bulkheading y Aislamiento para CRM de IA con 100+ Integraciones.
- [02-CONTEXT-GOVERNANCE-TOKENOMICS-AND-PLATFORMS.md](https://github.com/trautslab/ai-sdlc-framework/blob/main/docs/deep-dives/02-CONTEXT-GOVERNANCE-TOKENOMICS-AND-PLATFORMS.md) — Gobernanza Inmune a la Saturación/Compactación de Contexto, Tokenomics de Alta Escala y Garantías en Antigravity / Claude Code / Codex / Cursor.

## ☁️ 1.2. Despliegue, Infraestructura & Gobernanza de Ambientes
- [`DEP-XXXX` (Plantilla de Despliegue Multi-Cloud Agnóstico)](diagrams/deployment/DEP-TEMPLATE.md) — Topología C4/UML: Edge, Ingress, Cómputo, Datos y SaaS (AWS, GCP, Azure, OCI, Cloudflare, Supabase, Vercel).
- [`SEC-NET-XXXX` (Plantilla de Topología de Red & Seguridad Zero-Trust)](diagrams/network-topology/SEC-NET-TEMPLATE.md) — Segmentación en Subnets (DMZ, App, Data), WAF, NAT, Security Groups y Políticas IAM.
- [`ENV-MATRIX` (Plantilla de 4 Ambientes DEV / QA / UAT / PROD)](environments/ENV-MATRIX-TEMPLATE.md) — Gobernanza de etapas, gestión de secretos en Vaults/KMS y Quality Gates de promoción.
- [`FINOPS-XXXX` (Plantilla de Modelo FinOps & Presupuesto Cloud)](finops/FINOPS-TEMPLATE.md) — Bill of Materials (BOM), costos fijos/variables, tokenomics de IA y comisiones de pasarela.

---

## 🎯 2. Matriz de Trazabilidad: Casos de Uso vs Artefactos de Arquitectura

> 💡 **Nota sobre las plantillas:** Los moldes reutilizables se nombran con sufijo `*-TEMPLATE.md` y usan el identificador `XXXX`. Al crear el primer caso de uso real de tu proyecto, clona `UC-TEMPLATE.md` hacia `UC-001-nombre-del-flujo.md` sin sobreescribir la plantilla ni causar colisiones de ID.

| ID Caso de Uso | Título | Dominio | Red Trazabilidad | Secuencia | Robustez | Componentes | Máquina Estados | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| [`UC-001`](use-cases/UC-001-dynamic-qr-and-offline-checkin.md) | Generación de QR Dinámico y Validación Perimetral Offline | Control de Accesos | [`NET-TEMPLATE`](diagrams/use-case-network/NET-TEMPLATE.md) | [`SEQ-TEMPLATE`](diagrams/sequences/SEQ-TEMPLATE.md) | [`ROB-TEMPLATE`](diagrams/robustness/ROB-TEMPLATE.md) | [`CMP-TEMPLATE`](diagrams/components/CMP-TEMPLATE.md) | [`STM-TEMPLATE`](diagrams/state-machines/STM-TEMPLATE.md) | `ACCEPTED 🟢` |
| [`UC-002`](use-cases/UC-002-offline-turnstile-validation.md) | Validación Perimetral Fuera de Línea en Torniquetes | Control de Accesos | [`NET-TEMPLATE`](diagrams/use-case-network/NET-TEMPLATE.md) | [`SEQ-TEMPLATE`](diagrams/sequences/SEQ-TEMPLATE.md) | [`ROB-TEMPLATE`](diagrams/robustness/ROB-TEMPLATE.md) | [`CMP-TEMPLATE`](diagrams/components/CMP-TEMPLATE.md) | [`STM-TEMPLATE`](diagrams/state-machines/STM-TEMPLATE.md) | `ACCEPTED 🟢` |
| [`UC-003`](use-cases/UC-003-p2p-transfer-and-anti-scalping.md) | Transferencia P2P Segura y Gobernanza Anti-Revendedores | Transferencia P2P | [`NET-TEMPLATE`](diagrams/use-case-network/NET-TEMPLATE.md) | [`SEQ-TEMPLATE`](diagrams/sequences/SEQ-TEMPLATE.md) | [`ROB-TEMPLATE`](diagrams/robustness/ROB-TEMPLATE.md) | [`CMP-TEMPLATE`](diagrams/components/CMP-TEMPLATE.md) | [`STM-TEMPLATE`](diagrams/state-machines/STM-TEMPLATE.md) | `ACCEPTED 🟢` |
| [`UC-004`](use-cases/UC-004-realtime-simulation-and-dashboard.md) | Observabilidad en Tiempo Real y Consola de Simulación | Telemetría | [`NET-TEMPLATE`](diagrams/use-case-network/NET-TEMPLATE.md) | [`SEQ-TEMPLATE`](diagrams/sequences/SEQ-TEMPLATE.md) | [`ROB-TEMPLATE`](diagrams/robustness/ROB-TEMPLATE.md) | [`CMP-TEMPLATE`](diagrams/components/CMP-TEMPLATE.md) | [`STM-TEMPLATE`](diagrams/state-machines/STM-TEMPLATE.md) | `ACCEPTED 🟢` |
| [`UC-XXXX`](use-cases/UC-TEMPLATE.md) | [Nombre del Caso de Uso Formal] | Dominio | [`NET-XXXX`](diagrams/use-case-network/NET-TEMPLATE.md) | [`SEQ-XXXX`](diagrams/sequences/SEQ-TEMPLATE.md) | [`ROB-XXXX`](diagrams/robustness/ROB-TEMPLATE.md) | [`CMP-XXXX`](diagrams/components/CMP-TEMPLATE.md) | [`STM-XXXX`](diagrams/state-machines/STM-TEMPLATE.md) | `DRAFT 🟡` |

---

## 📊 3. Catálogo de Plantillas por Tipo

### ☁️ Diagramas de Despliegue Multi-Cloud (`docs/diagrams/deployment/`)
- [`DEP-TEMPLATE`](diagrams/deployment/DEP-TEMPLATE.md) — Topología física/lógica de contenedores, balanceadores y almacenes gestionados.

### 🛡️ Topología de Red y Seguridad (`docs/diagrams/network-topology/`)
- [`SEC-NET-TEMPLATE`](diagrams/network-topology/SEC-NET-TEMPLATE.md) — Arquitectura de red DMZ, subredes privadas aisladas y reglas de firewall.

### 🕸️ Red de Trazabilidad de Casos de Uso (`docs/diagrams/use-case-network/`)
- [`NET-TEMPLATE`](diagrams/use-case-network/NET-TEMPLATE.md) — Grafo de dependencia: Requerimiento $\rightarrow$ Caso de Uso $\rightarrow$ Tarea Agente $\rightarrow$ Worktree $\rightarrow$ Commit.

### 🧩 Diagramas de Componentes e Interfaces (`docs/diagrams/components/`)
- [`CMP-TEMPLATE`](diagrams/components/CMP-TEMPLATE.md) — Descomposición modular, puertos/interfaces y asignación de ownership por subagente IA.

### 🛡️ Diagramas de Robustez (`docs/diagrams/robustness/`)
- [`ROB-TEMPLATE`](diagrams/robustness/ROB-TEMPLATE.md) — Validación BCE (Frontera $\rightarrow$ Control $\rightarrow$ Entidad) de reglas de negocio y políticas de persistencia.

### 🔄 Diagramas de Secuencia (`docs/diagrams/sequences/`)
- [`SEQ-TEMPLATE`](diagrams/sequences/SEQ-TEMPLATE.md) — Flujo temporal con verificación de caché y base de datos.

### ⚙️ Diagramas de Actividad / Flujos (`docs/diagrams/activities/`)
- [`ACT-TEMPLATE`](diagrams/activities/ACT-TEMPLATE.md) — Lógica de validación, bifurcaciones y rollback.

### 🔀 Máquinas de Estados (`docs/diagrams/state-machines/`)
- [`STM-TEMPLATE`](diagrams/state-machines/STM-TEMPLATE.md) — Ciclo de vida y transiciones de entidades.

### 💾 Modelo de Datos (`docs/diagrams/entity-relationship/`)
- [`ERD-TEMPLATE`](diagrams/entity-relationship/ERD-TEMPLATE.md) — Diagrama Entidad-Relación de PostgreSQL.

### 📅 Roadmap y Planificación Humano-IA (`docs/diagrams/gantt/`)
- [`GANTT-TEMPLATE`](diagrams/gantt/GANTT-TEMPLATE.md) — Cronograma interactivo (PO vs Tech Lead vs Agente IA) y protocolo de auditoría/rollback.

---

## 📝 4. Especificaciones Técnicas (RFCs)
- [`RFC-001: Motor Criptográfico de Smart Ticketing`](specs/RFC-001-smart-ticketing-dynamic-qr.md) — Especificación técnica del QR rotativo de 15s (HMAC-SHA256), validación perimetral offline sub-80ms y protocolo P2P anti-reventa.
- [`RFC-TEMPLATE`](specs/RFC-TEMPLATE.md) — Plantilla de especificación técnica y requerimientos funcionales.



